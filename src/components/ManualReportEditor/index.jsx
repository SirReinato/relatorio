import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  regenerateReportSection,
  validateSectionProposal,
} from '../../services/api.js';
import {
  MAX_IMAGE_BYTES,
  MAX_IMAGE_DIMENSION,
  MAX_IMAGE_PIXELS,
  MAX_REPORT_IMAGE_BYTES,
  loadReportDraft,
  saveReportDraft,
} from '../../services/reportDrafts.js';
import {
  AreaTextoRelatorioStl,
  BotaoEditorStl,
  CabecalhoEditorStl,
  CabecalhoSecaoStl,
  CampoRelatorioStl,
  CartaoImagemStl,
  CartaoSecaoStl,
  GradeImagensStl,
  GrupoAcoesStl,
  GrupoCamposStl,
  GrupoSecoesStl,
  InputRelatorioStl,
  ItemDetalheStl,
  ListaDetalhesStl,
  MensagemErroStl,
  PaginaEditorStl,
  PainelPreviaStl,
  SelecaoRelatorioStl,
  StatusSalvamentoStl,
  TextoSecundarioStl,
  TituloEditorStl,
  TituloSecaoStl,
} from './styles.js';

const imageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const formatLabels = { pdf: 'PDF', docx: 'DOCX', markdown: 'Markdown' };

function createIdentifier() {
  return crypto.randomUUID();
}

function createDraft(configuration) {
  return {
    schemaVersion: 1,
    id: createIdentifier(),
    title: 'Novo relatório',
    topic: '',
    brief: {
      objective: null,
      audience: null,
      desiredLength: null,
      tone: null,
      references: [],
    },
    sections: [{
      id: createIdentifier(),
      title: 'Introdução',
      body: '',
      importantDetails: [],
      images: [],
    }],
    selectedFormats: Array.isArray(configuration?.selectedFormats)
      ? configuration.selectedFormats.filter((format) => formatLabels[format])
      : [],
    pdfTemplateId: configuration?.pdfTemplateId || null,
    updatedAt: new Date().toISOString(),
  };
}

function replaceDraft(draft, changes) {
  return { ...draft, ...changes, updatedAt: new Date().toISOString() };
}

function getImageMediaType(bytes) {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (
    bytes[0] === 0x89
    && bytes[1] === 0x50
    && bytes[2] === 0x4e
    && bytes[3] === 0x47
    && bytes[4] === 0x0d
    && bytes[5] === 0x0a
    && bytes[6] === 0x1a
    && bytes[7] === 0x0a
  ) return 'image/png';
  if (
    bytes[0] === 0x52
    && bytes[1] === 0x49
    && bytes[2] === 0x46
    && bytes[3] === 0x46
    && bytes[8] === 0x57
    && bytes[9] === 0x45
    && bytes[10] === 0x42
    && bytes[11] === 0x50
  ) return 'image/webp';
  return null;
}

function validateDraft(draft) {
  const errors = [];
  if (!draft.title.trim()) errors.push('Informe o título do relatório.');
  if (!draft.topic.trim()) errors.push('Informe o tema do relatório.');
  if (draft.sections.length === 0) errors.push('Adicione ao menos uma seção.');
  if (draft.sections.length > 20) errors.push('O relatório pode ter no máximo 20 seções.');
  if (draft.brief.references.length > 10) errors.push('Informe no máximo 10 referências.');
  if (draft.brief.references.some((reference) => reference.length > 500)) {
    errors.push('Cada referência pode ter no máximo 500 caracteres.');
  }
  if (draft.sections.reduce((total, section) => total + section.body.length, 0) > 50000) {
    errors.push('O conteúdo do relatório excede 50.000 caracteres.');
  }

  draft.sections.forEach((section, index) => {
    const label = `Seção ${index + 1}`;
    if (!section.title.trim()) errors.push(`${label}: informe um título.`);
    if (section.title.length > 200) errors.push(`${label}: o título pode ter no máximo 200 caracteres.`);
    if (section.body.length > 12000) errors.push(`${label}: o conteúdo pode ter no máximo 12.000 caracteres.`);
    if (section.importantDetails.length > 20) errors.push(`${label}: informe no máximo 20 detalhes importantes.`);
    if (section.importantDetails.some((detail) => !detail.trim() || detail.length > 500)) {
      errors.push(`${label}: cada detalhe deve conter até 500 caracteres e não pode ficar vazio.`);
    }
    if (section.images.length > 20) errors.push(`${label}: adicione no máximo 20 imagens.`);
  });

  return errors;
}

function moveSection(sections, sectionIndex, direction) {
  const destination = sectionIndex + direction;
  if (destination < 0 || destination >= sections.length) return sections;
  const reordered = [...sections];
  [reordered[sectionIndex], reordered[destination]] = [reordered[destination], reordered[sectionIndex]];
  return reordered;
}

function formatUpdatedAt(value) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

export default function ManualReportEditor({
  configuration,
  draftId,
  initialDraft,
  initialSaveError,
}) {
  const navigate = useNavigate();
  const canonicalizingId = useRef('');
  const sectionRevisions = useRef(new Map());
  const regenerationControllers = useRef(new Map());
  const [draft, setDraft] = useState(null);
  const [imageBlobs, setImageBlobs] = useState(() => new Map());
  const [imageUrls, setImageUrls] = useState(() => new Map());
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saveStatus, setSaveStatus] = useState('loading');
  const [uploadError, setUploadError] = useState('');
  const [showValidation, setShowValidation] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [regeneratingSections, setRegeneratingSections] = useState(() => new Set());
  const [sectionProposals, setSectionProposals] = useState(() => new Map());
  const [regenerationErrors, setRegenerationErrors] = useState(() => new Map());

  const validationErrors = useMemo(() => (draft ? validateDraft(draft) : []), [draft]);
  const totalImageBytes = draft
    ? draft.sections.flatMap((section) => section.images).reduce((total, image) => total + image.sizeBytes, 0)
    : 0;

  useEffect(() => {
    let isMounted = true;

    async function initializeDraft() {
      if (draftId) {
        try {
          if (initialDraft?.id === draftId) {
            if (!isMounted) return;
            setDraft(initialDraft);
            setImageBlobs(new Map());
            if (initialSaveError) setSaveError(initialSaveError);
            setSaveStatus(initialSaveError ? 'error' : 'saving');
            return;
          }
          const stored = await loadReportDraft(draftId);
          if (!stored) throw new Error('Este rascunho não foi encontrado no armazenamento local.');
          if (!isMounted) return;
          setDraft(stored.draft);
          setImageBlobs(new Map(stored.images));
        } catch (error) {
          if (isMounted) setLoadError(error.message);
          return;
        }
      } else {
        setDraft(createDraft(configuration));
      }
      if (isMounted) setSaveStatus('saving');
    }

    initializeDraft();
    return () => {
      isMounted = false;
    };
  }, [configuration, draftId, initialDraft, initialSaveError]);

  useEffect(() => () => {
    regenerationControllers.current.forEach((controller) => controller.abort());
    regenerationControllers.current.clear();
  }, []);

  useEffect(() => {
    const urls = new Map();
    for (const [imageId, blob] of imageBlobs) {
      urls.set(imageId, URL.createObjectURL(blob));
    }
    setImageUrls(urls);
    return () => {
      for (const url of urls.values()) URL.revokeObjectURL(url);
    };
  }, [imageBlobs]);

  useEffect(() => {
    if (!draft) return undefined;
    setSaveStatus('saving');
    const timeoutId = window.setTimeout(async () => {
      try {
        await saveReportDraft(draft, imageBlobs);
        setSaveError('');
        setSaveStatus('saved');
        if (!draftId && canonicalizingId.current !== draft.id) {
          canonicalizingId.current = draft.id;
          navigate(`/relatorios/novo/${draft.id}`, { replace: true, state: { mode: 'manual' } });
        }
      } catch (error) {
        setSaveError(error.message);
        setSaveStatus('error');
      }
    }, 500);
    return () => window.clearTimeout(timeoutId);
  }, [draft, imageBlobs, draftId, navigate]);

  useEffect(() => {
    if (!draft || saveStatus === 'saved') return undefined;
    function warnBeforeLeaving(event) {
      event.preventDefault();
      event.returnValue = '';
    }
    window.addEventListener('beforeunload', warnBeforeLeaving);
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving);
  }, [draft, saveStatus]);

  function updateDraft(changes) {
    setDraft((current) => replaceDraft(current, changes));
  }

  function updateBrief(field, value) {
    setDraft((current) => replaceDraft(current, {
      brief: { ...current.brief, [field]: value },
    }));
  }

  function updateSection(sectionId, changes) {
    sectionRevisions.current.set(sectionId, (sectionRevisions.current.get(sectionId) || 0) + 1);
    setSectionProposals((current) => {
      if (!current.has(sectionId)) return current;
      const next = new Map(current);
      next.delete(sectionId);
      return next;
    });
    setDraft((current) => replaceDraft(current, {
      sections: current.sections.map((section) => (
        section.id === sectionId ? { ...section, ...changes } : section
      )),
    }));
  }

  async function regenerateSection(section) {
    const controller = new AbortController();
    const revision = sectionRevisions.current.get(section.id) || 0;
    regenerationControllers.current.set(section.id, controller);
    setRegeneratingSections((current) => new Set(current).add(section.id));
    setRegenerationErrors((current) => {
      const next = new Map(current);
      next.delete(section.id);
      return next;
    });
    setSectionProposals((current) => {
      const next = new Map(current);
      next.delete(section.id);
      return next;
    });

    try {
      const response = await regenerateReportSection({
        reportContext: {
          title: draft.title,
          topic: draft.topic,
          brief: draft.brief,
          sectionTitles: draft.sections.map((item) => item.title),
        },
        targetSection: {
          id: section.id,
          title: section.title,
          body: section.body,
          importantDetails: section.importantDetails,
          clientRevision: revision,
        },
      }, { signal: controller.signal });
      const proposal = validateSectionProposal(response, section.id, revision);
      if ((sectionRevisions.current.get(section.id) || 0) !== revision) {
        setRegenerationErrors((current) => new Map(current).set(
          section.id,
          'A seção mudou durante a geração. A proposta desatualizada foi descartada.',
        ));
        return;
      }
      setSectionProposals((current) => new Map(current).set(section.id, {
        proposal,
        revision,
      }));
    } catch (error) {
      if (error.name === 'AbortError' || controller.signal.aborted) {
        setRegenerationErrors((current) => new Map(current).set(section.id, 'Regeneração cancelada.'));
      } else {
        setRegenerationErrors((current) => new Map(current).set(section.id, error.message));
      }
    } finally {
      if (regenerationControllers.current.get(section.id) === controller) {
        regenerationControllers.current.delete(section.id);
      }
      setRegeneratingSections((current) => {
        const next = new Set(current);
        next.delete(section.id);
        return next;
      });
    }
  }

  function applySectionProposal(sectionId) {
    const entry = sectionProposals.get(sectionId);
    if (!entry) return;
    if ((sectionRevisions.current.get(sectionId) || 0) !== entry.revision) {
      setRegenerationErrors((current) => new Map(current).set(
        sectionId,
        'A seção mudou desde a geração. Gere uma nova proposta antes de aplicá-la.',
      ));
      setSectionProposals((current) => {
        const next = new Map(current);
        next.delete(sectionId);
        return next;
      });
      return;
    }

    updateSection(sectionId, {
      title: entry.proposal.title,
      body: entry.proposal.body,
      importantDetails: entry.proposal.importantDetails,
    });
  }

  async function persistNow() {
    setSaveStatus('saving');
    try {
      await saveReportDraft(draft, imageBlobs);
      setSaveError('');
      setSaveStatus('saved');
      if (!draftId && canonicalizingId.current !== draft.id) {
        canonicalizingId.current = draft.id;
        navigate(`/relatorios/novo/${draft.id}`, { replace: true, state: { mode: 'manual' } });
      }
      return true;
    } catch (error) {
      setSaveError(error.message);
      setSaveStatus('error');
      return false;
    }
  }

  async function returnToHome() {
    const saved = await persistNow();
    if (saved || window.confirm('O rascunho não foi salvo. Se sair, as alterações desta sessão serão perdidas. Deseja voltar mesmo assim?')) {
      navigate('/');
    }
  }

  function addSection() {
    if (draft.sections.length >= 20) return;
    updateDraft({
      sections: [...draft.sections, {
        id: createIdentifier(),
        title: `Seção ${draft.sections.length + 1}`,
        body: '',
        importantDetails: [],
        images: [],
      }],
    });
  }

  function removeSection(sectionId) {
    if (draft.sections.length <= 1) return;
    const removed = draft.sections.find((section) => section.id === sectionId);
    updateDraft({ sections: draft.sections.filter((section) => section.id !== sectionId) });
    if (removed?.images.length) {
      setImageBlobs((current) => {
        const next = new Map(current);
        removed.images.forEach((image) => next.delete(image.id));
        return next;
      });
    }
  }

  function reorderSection(sectionIndex, direction) {
    updateDraft({ sections: moveSection(draft.sections, sectionIndex, direction) });
  }

  function addImportantDetail(section) {
    if (section.importantDetails.length >= 20) return;
    updateSection(section.id, { importantDetails: [...section.importantDetails, ''] });
  }

  function updateImportantDetail(section, detailIndex, value) {
    updateSection(section.id, {
      importantDetails: section.importantDetails.map((detail, index) => (
        index === detailIndex ? value : detail
      )),
    });
  }

  function removeImportantDetail(section, detailIndex) {
    updateSection(section.id, {
      importantDetails: section.importantDetails.filter((_, index) => index !== detailIndex),
    });
  }

  async function addImage(section, file, replaceImageId = null) {
    setUploadError('');
    if (!file) return;
    if (!imageTypes.has(file.type)) {
      setUploadError('Use somente arquivos JPEG, PNG ou WebP.');
      return;
    }
    if (!file.size || file.size > MAX_IMAGE_BYTES) {
      setUploadError('Cada imagem deve ter até 5 MiB.');
      return;
    }
    if (file.name.length > 255) {
      setUploadError('O nome do arquivo deve ter até 255 caracteres.');
      return;
    }

    const replacedImage = replaceImageId
      ? section.images.find((image) => image.id === replaceImageId)
      : null;
    const nextTotal = totalImageBytes - (replacedImage?.sizeBytes || 0) + file.size;
    if (nextTotal > MAX_REPORT_IMAGE_BYTES) {
      setUploadError('As imagens do relatório podem ocupar no máximo 20 MiB.');
      return;
    }
    if (!replaceImageId && section.images.length >= 20) {
      setUploadError('Cada seção pode ter no máximo 20 imagens.');
      return;
    }

    try {
      const signature = new Uint8Array(await file.slice(0, 12).arrayBuffer());
      if (getImageMediaType(signature) !== file.type) {
        setUploadError('O conteúdo do arquivo não corresponde ao formato de imagem informado.');
        return;
      }

      const bitmap = await createImageBitmap(file);
      const imageWidth = bitmap.width;
      const imageHeight = bitmap.height;
      bitmap.close();
      if (
        imageWidth > MAX_IMAGE_DIMENSION
        || imageHeight > MAX_IMAGE_DIMENSION
        || imageWidth * imageHeight > MAX_IMAGE_PIXELS
      ) {
        setUploadError('A imagem deve ter no máximo 12 megapixels e 5.000 pixels por dimensão.');
        return;
      }

      const imageId = replacedImage?.id || createIdentifier();
      const image = {
        id: imageId,
        fileName: file.name,
        mediaType: file.type,
        sizeBytes: file.size,
        caption: replacedImage?.caption || null,
      };
      setImageBlobs((current) => new Map(current).set(imageId, file));
      updateSection(section.id, {
        images: replacedImage
          ? section.images.map((item) => (item.id === imageId ? image : item))
          : [...section.images, image],
      });
    } catch {
      setUploadError('Não foi possível ler esta imagem. Escolha um JPEG, PNG ou WebP válido.');
    }
  }

  function removeImage(section, imageId) {
    updateSection(section.id, { images: section.images.filter((image) => image.id !== imageId) });
    setImageBlobs((current) => {
      const next = new Map(current);
      next.delete(imageId);
      return next;
    });
  }

  function openPreview() {
    setShowValidation(true);
    if (validationErrors.length === 0) setIsPreviewOpen(true);
  }

  if (loadError) {
    return (
      <PaginaEditorStl data-testid="editor-relatorio">
        <TituloEditorStl>Não foi possível abrir o rascunho</TituloEditorStl>
        <MensagemErroStl role="alert">{loadError}</MensagemErroStl>
        <BotaoEditorStl type="button" onClick={() => navigate('/')}>Voltar para o início</BotaoEditorStl>
      </PaginaEditorStl>
    );
  }

  if (!draft) {
    return <PaginaEditorStl role="status">Carregando rascunho…</PaginaEditorStl>;
  }

  return (
    <PaginaEditorStl data-testid="editor-relatorio">
      <CabecalhoEditorStl>
        <div>
          <TituloEditorStl>Escreva seu relatório</TituloEditorStl>
          <TextoSecundarioStl>O rascunho e as imagens ficam neste navegador. Nada é enviado ao servidor nesta etapa.</TextoSecundarioStl>
        </div>
        <BotaoEditorStl type="button" onClick={returnToHome}>Voltar para o início</BotaoEditorStl>
      </CabecalhoEditorStl>

      <StatusSalvamentoStl
        role={saveStatus === 'error' ? 'alert' : 'status'}
        $isError={saveStatus === 'error'}
        data-testid="estado-salvamento"
      >
        {saveStatus === 'saved' && `Rascunho salvo neste navegador às ${formatUpdatedAt(draft.updatedAt)}.`}
        {saveStatus === 'saving' && 'Salvando rascunho neste navegador…'}
        {saveStatus === 'error' && saveError}
      </StatusSalvamentoStl>
      {saveStatus === 'error' && (
        <GrupoAcoesStl>
          <BotaoEditorStl type="button" onClick={persistNow}>Tentar salvar novamente</BotaoEditorStl>
        </GrupoAcoesStl>
      )}

      <GrupoCamposStl>
        <CampoRelatorioStl>
          Título do relatório
          <InputRelatorioStl
            aria-label="Título do relatório"
            maxLength={200}
            value={draft.title}
            onChange={(event) => updateDraft({ title: event.target.value })}
          />
        </CampoRelatorioStl>
        <CampoRelatorioStl>
          Tema do relatório
          <InputRelatorioStl
            aria-label="Tema do relatório"
            maxLength={500}
            value={draft.topic}
            onChange={(event) => updateDraft({ topic: event.target.value })}
          />
        </CampoRelatorioStl>
        <CampoRelatorioStl>
          Objetivo (opcional)
          <AreaTextoRelatorioStl
            aria-label="Objetivo"
            maxLength={2000}
            value={draft.brief.objective || ''}
            onChange={(event) => updateBrief('objective', event.target.value || null)}
          />
        </CampoRelatorioStl>
        <CampoRelatorioStl>
          Público-alvo (opcional)
          <AreaTextoRelatorioStl
            aria-label="Público-alvo"
            maxLength={2000}
            value={draft.brief.audience || ''}
            onChange={(event) => updateBrief('audience', event.target.value || null)}
          />
        </CampoRelatorioStl>
        <CampoRelatorioStl>
          Extensão desejada (opcional)
          <SelecaoRelatorioStl
            aria-label="Extensão desejada"
            value={draft.brief.desiredLength || ''}
            onChange={(event) => updateBrief('desiredLength', event.target.value || null)}
          >
            <option value="">Não selecionada</option>
            <option value="short">Curta</option>
            <option value="medium">Média</option>
            <option value="long">Longa</option>
          </SelecaoRelatorioStl>
        </CampoRelatorioStl>
        <CampoRelatorioStl>
          Tom (opcional)
          <InputRelatorioStl
            aria-label="Tom"
            maxLength={2000}
            value={draft.brief.tone || ''}
            onChange={(event) => updateBrief('tone', event.target.value || null)}
          />
        </CampoRelatorioStl>
        <CampoRelatorioStl>
          Fontes e referências (uma por linha, opcionais)
          <AreaTextoRelatorioStl
            aria-label="Fontes e referências"
            maxLength={5000}
            value={draft.brief.references.join('\n')}
            onChange={(event) => updateBrief(
              'references',
              event.target.value.split('\n').filter((reference) => reference.trim()).map((reference) => reference.trim()),
            )}
          />
        </CampoRelatorioStl>
      </GrupoCamposStl>

      <GrupoAcoesStl>
        <TextoSecundarioStl>Formatos selecionados:</TextoSecundarioStl>
        {Object.entries(formatLabels).map(([format, label]) => (
          <label key={format}>
            <input
              type="checkbox"
              checked={draft.selectedFormats.includes(format)}
              aria-label={`Formato ${label}`}
              onChange={() => updateDraft({
                selectedFormats: draft.selectedFormats.includes(format)
                  ? draft.selectedFormats.filter((item) => item !== format)
                  : [...draft.selectedFormats, format],
              })}
            />{' '}
            {label}
          </label>
        ))}
        <TextoSecundarioStl data-testid="modelo-pdf">
          Modelo PDF: {draft.pdfTemplateId || 'Nenhum modelo selecionado'}
        </TextoSecundarioStl>
      </GrupoAcoesStl>

      <GrupoSecoesStl aria-label="Seções do relatório">
        {draft.sections.map((section, sectionIndex) => (
          <CartaoSecaoStl
            key={section.id}
            aria-labelledby={`titulo-${section.id}`}
            data-testid={`secao-${sectionIndex + 1}`}
          >
            <CabecalhoSecaoStl>
              <TituloSecaoStl id={`titulo-${section.id}`}>Seção {sectionIndex + 1}</TituloSecaoStl>
              <GrupoAcoesStl>
                <BotaoEditorStl
                  type="button"
                  aria-label={`Mover seção ${sectionIndex + 1} para cima`}
                  disabled={sectionIndex === 0}
                  onClick={() => reorderSection(sectionIndex, -1)}
                >Mover para cima</BotaoEditorStl>
                <BotaoEditorStl
                  type="button"
                  aria-label={`Mover seção ${sectionIndex + 1} para baixo`}
                  disabled={sectionIndex === draft.sections.length - 1}
                  onClick={() => reorderSection(sectionIndex, 1)}
                >Mover para baixo</BotaoEditorStl>
                <BotaoEditorStl
                  type="button"
                  $variant="danger"
                  disabled={draft.sections.length === 1}
                  onClick={() => removeSection(section.id)}
                >Remover seção</BotaoEditorStl>
                {regeneratingSections.has(section.id) ? (
                  <BotaoEditorStl
                    type="button"
                    onClick={() => regenerationControllers.current.get(section.id)?.abort()}
                  >Cancelar regeneração</BotaoEditorStl>
                ) : (
                  <BotaoEditorStl
                    type="button"
                    onClick={() => regenerateSection(section)}
                  >Regenerar seção com IA</BotaoEditorStl>
                )}
              </GrupoAcoesStl>
            </CabecalhoSecaoStl>

            {regeneratingSections.has(section.id) && (
                <TextoSecundarioStl role="status">Gerando proposta para esta seção…</TextoSecundarioStl>
            )}
            {regenerationErrors.has(section.id) && (
                <MensagemErroStl role="alert">{regenerationErrors.get(section.id)}</MensagemErroStl>
            )}
            {sectionProposals.has(section.id) && (
                <PainelPreviaStl aria-label={`Proposta para seção ${sectionIndex + 1}`}>
                  <TituloSecaoStl>Proposta de regeneração — revise antes de aplicar</TituloSecaoStl>
                  <h4>{sectionProposals.get(section.id).proposal.title}</h4>
                  <p>{sectionProposals.get(section.id).proposal.body}</p>
                  {sectionProposals.get(section.id).proposal.importantDetails.length > 0 && (
                    <ul>
                      {sectionProposals.get(section.id).proposal.importantDetails.map((detail, index) => (
                        <li key={`${section.id}-proposal-${index}`}>{detail}</li>
                      ))}
                    </ul>
                  )}
                  <GrupoAcoesStl>
                    <BotaoEditorStl type="button" $variant="primary" onClick={() => applySectionProposal(section.id)}>
                      Aplicar proposta
                    </BotaoEditorStl>
                    <BotaoEditorStl
                      type="button"
                      onClick={() => setSectionProposals((current) => {
                        const next = new Map(current);
                        next.delete(section.id);
                        return next;
                      })}
                    >Descartar proposta</BotaoEditorStl>
                  </GrupoAcoesStl>
                </PainelPreviaStl>
            )}

            <CampoRelatorioStl>
              Título da seção
              <InputRelatorioStl
                aria-label={`Título da seção ${sectionIndex + 1}`}
                maxLength={200}
                value={section.title}
                onChange={(event) => updateSection(section.id, { title: event.target.value })}
              />
            </CampoRelatorioStl>
            <CampoRelatorioStl>
              Conteúdo
              <AreaTextoRelatorioStl
                aria-label={`Conteúdo da seção ${sectionIndex + 1}`}
                maxLength={12000}
                value={section.body}
                onChange={(event) => updateSection(section.id, { body: event.target.value })}
              />
            </CampoRelatorioStl>

            <div>
              <TextoSecundarioStl>Detalhes importantes</TextoSecundarioStl>
              <ListaDetalhesStl>
                {section.importantDetails.map((detail, detailIndex) => (
                  <ItemDetalheStl key={`${section.id}-detail-${detailIndex}`}>
                    <InputRelatorioStl
                      aria-label={`Detalhe ${detailIndex + 1} da seção ${sectionIndex + 1}`}
                      maxLength={500}
                      value={detail}
                      onChange={(event) => updateImportantDetail(section, detailIndex, event.target.value)}
                    />
                    <BotaoEditorStl
                      type="button"
                      aria-label={`Remover detalhe ${detailIndex + 1} da seção ${sectionIndex + 1}`}
                      onClick={() => removeImportantDetail(section, detailIndex)}
                    >Remover detalhe</BotaoEditorStl>
                  </ItemDetalheStl>
                ))}
              </ListaDetalhesStl>
              <BotaoEditorStl
                type="button"
                disabled={section.importantDetails.length >= 20}
                onClick={() => addImportantDetail(section)}
              >Adicionar detalhe importante</BotaoEditorStl>
            </div>

            <CampoRelatorioStl>
              Adicionar imagem (JPEG, PNG ou WebP; até 5 MiB)
              <InputRelatorioStl
                type="file"
                accept="image/jpeg,image/png,image/webp"
                aria-label={`Adicionar imagem à seção ${sectionIndex + 1}`}
                onChange={(event) => {
                  addImage(section, event.target.files?.[0]);
                  event.target.value = '';
                }}
              />
            </CampoRelatorioStl>
            {section.images.length > 0 && (
              <GradeImagensStl>
                {section.images.map((image) => (
                  <CartaoImagemStl key={image.id}>
                    {imageUrls.has(image.id) && (
                      <img src={imageUrls.get(image.id)} alt={image.caption || image.fileName} />
                    )}
                    <figcaption>{image.fileName} ({(image.sizeBytes / 1024).toFixed(1)} KiB)</figcaption>
                    <InputRelatorioStl
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      aria-label={`Substituir imagem ${image.fileName}`}
                      onChange={(event) => {
                        addImage(section, event.target.files?.[0], image.id);
                        event.target.value = '';
                      }}
                    />
                    <InputRelatorioStl
                      aria-label={`Legenda da imagem ${image.fileName}`}
                      maxLength={500}
                      placeholder="Legenda opcional"
                      value={image.caption || ''}
                      onChange={(event) => updateSection(section.id, {
                        images: section.images.map((item) => (
                          item.id === image.id ? { ...item, caption: event.target.value || null } : item
                        )),
                      })}
                    />
                    <BotaoEditorStl
                      type="button"
                      $variant="danger"
                      onClick={() => removeImage(section, image.id)}
                    >Remover imagem</BotaoEditorStl>
                  </CartaoImagemStl>
                ))}
              </GradeImagensStl>
            )}
          </CartaoSecaoStl>
        ))}
      </GrupoSecoesStl>

      {uploadError && <MensagemErroStl role="alert">{uploadError}</MensagemErroStl>}
      <GrupoAcoesStl>
        <BotaoEditorStl
          type="button"
          $variant="primary"
          disabled={draft.sections.length >= 20}
          onClick={addSection}
        >Adicionar seção</BotaoEditorStl>
        <BotaoEditorStl type="button" $variant="primary" onClick={openPreview}>Pré-visualizar</BotaoEditorStl>
      </GrupoAcoesStl>

      {showValidation && validationErrors.length > 0 && (
        <MensagemErroStl role="alert" data-testid="erros-validacao">
          Revise os campos antes de abrir a prévia:
          <ul>{validationErrors.map((error) => <li key={error}>{error}</li>)}</ul>
        </MensagemErroStl>
      )}

      {isPreviewOpen && (
        <PainelPreviaStl aria-label="Prévia do relatório" data-testid="previa-relatorio">
          <GrupoAcoesStl>
            <TituloEditorStl>Prévia do relatório</TituloEditorStl>
            <BotaoEditorStl type="button" onClick={() => setIsPreviewOpen(false)}>Fechar prévia</BotaoEditorStl>
          </GrupoAcoesStl>
          <TextoSecundarioStl>Formatos: {draft.selectedFormats.length
            ? draft.selectedFormats.map((format) => formatLabels[format]).join(', ')
            : 'nenhum selecionado'}</TextoSecundarioStl>
          <TextoSecundarioStl>Modelo PDF: {draft.pdfTemplateId || 'nenhum selecionado'}</TextoSecundarioStl>
          <h2>{draft.title}</h2>
          <p><strong>Tema:</strong> {draft.topic}</p>
          {draft.sections.map((section) => (
            <article key={section.id}>
              <h3>{section.title}</h3>
              {section.body.split('\n').map((paragraph, index) => (
                <p key={`${section.id}-paragraph-${index}`}>{paragraph || '\u00a0'}</p>
              ))}
              {section.importantDetails.length > 0 && (
                <ul>{section.importantDetails.map((detail, index) => <li key={`${section.id}-preview-${index}`}>{detail}</li>)}</ul>
              )}
              {section.images.map((image) => (
                imageUrls.has(image.id) && (
                  <figure key={image.id}>
                    <img src={imageUrls.get(image.id)} alt={image.caption || image.fileName} width="240" />
                    {image.caption && <figcaption>{image.caption}</figcaption>}
                  </figure>
                )
              ))}
            </article>
          ))}
          <TextoSecundarioStl>Esta prévia não gera nem exporta arquivos.</TextoSecundarioStl>
        </PainelPreviaStl>
      )}
    </PaginaEditorStl>
  );
}
