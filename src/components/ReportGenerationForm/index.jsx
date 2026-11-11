import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  generateReport,
  validateGeneratedReport,
} from '../../services/api.js';
import { saveReportDraft } from '../../services/reportDrafts.js';
import {
  AcoesGeracaoStl,
  BadgeTipoAnexoStl,
  BotaoGeracaoStl,
  BotaoRemoverAnexoStl,
  CampoGeracaoStl,
  ChipAnexoStl,
  ErroGeracaoStl,
  FormularioGeracaoStl,
  GradeCamposGeracaoStl,
  InputGeracaoStl,
  InputOcultoUploadStl,
  ListaAnexosStl,
  NomeAnexoStl,
  SelectGeracaoStl,
  TamanhoAnexoStl,
  TextoAjudaAnexoStl,
  TextoAreaGeracaoStl,
  TextoGeracaoStl,
  TituloGeracaoStl,
  ZonaDropUploadStl,
} from './styles.js';

const formatLabels = { pdf: 'PDF', docx: 'DOCX', markdown: 'Markdown' };

const MAX_ATTACHMENTS_COUNT = 3;
const MAX_COMBINED_ATTACHMENTS_BYTES = 15 * 1024 * 1024;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

const ALLOWED_EXTENSIONS = new Set(['pdf', 'xlsx', 'csv', 'png', 'jpg', 'jpeg', 'webp']);

function getFileExtension(filename) {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

function getFileTypeBadge(ext) {
  if (ext === 'pdf') return 'PDF';
  if (ext === 'xlsx' || ext === 'csv') return ext.toUpperCase();
  return 'IMG';
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validateFile(file) {
  const ext = getFileExtension(file.name);
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return `O arquivo "${file.name}" não é suportado. Formatos aceitos: PDF, XLSX, CSV, PNG, JPG e WebP.`;
  }
  const isImage = ['png', 'jpg', 'jpeg', 'webp'].includes(ext);
  const maxBytes = isImage ? MAX_IMAGE_BYTES : MAX_DOCUMENT_BYTES;
  if (file.size > maxBytes) {
    const limitLabel = isImage ? '5 MiB' : '10 MiB';
    return `O arquivo "${file.name}" excede o tamanho máximo de ${limitLabel}.`;
  }
  return null;
}

function parseReferences(value) {
  return value.split('\n').map((reference) => reference.trim()).filter(Boolean);
}

function validateInput(topic, brief) {
  if (!topic.trim()) return 'Informe o tema do relatório.';
  if (topic.length > 500) return 'O tema pode ter no máximo 500 caracteres.';
  if (brief.references.length > 10) return 'Informe no máximo 10 fontes ou referências.';
  if (brief.references.some((reference) => reference.length > 500)) {
    return 'Cada fonte ou referência pode ter no máximo 500 caracteres.';
  }
  return '';
}

export default function ReportGenerationForm({ configuration }) {
  const navigate = useNavigate();
  const controllerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [topic, setTopic] = useState('');
  const [objective, setObjective] = useState('');
  const [audience, setAudience] = useState('');
  const [desiredLength, setDesiredLength] = useState('medium');
  const [tone, setTone] = useState('');
  const [referencesText, setReferencesText] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [attachmentError, setAttachmentError] = useState('');
  const [requestState, setRequestState] = useState('idle');
  const [requestError, setRequestError] = useState('');
  const [inputError, setInputError] = useState('');

  useEffect(() => () => controllerRef.current?.abort(), []);

  function handleFilesAdded(files) {
    setAttachmentError('');
    const incoming = Array.from(files);
    if (incoming.length === 0) return;

    if (attachments.length + incoming.length > MAX_ATTACHMENTS_COUNT) {
      setAttachmentError(`Você pode anexar no máximo ${MAX_ATTACHMENTS_COUNT} arquivos no total.`);
      return;
    }

    for (const file of incoming) {
      const error = validateFile(file);
      if (error) {
        setAttachmentError(error);
        return;
      }
    }

    const currentTotal = attachments.reduce((sum, f) => sum + f.size, 0);
    const incomingTotal = incoming.reduce((sum, f) => sum + f.size, 0);
    if (currentTotal + incomingTotal > MAX_COMBINED_ATTACHMENTS_BYTES) {
      setAttachmentError('O tamanho total combinado dos anexos não pode exceder 15 MiB.');
      return;
    }

    setAttachments((current) => {
      const updated = [...current];
      for (const file of incoming) {
        const exists = updated.some((f) => f.name === file.name && f.size === file.size);
        if (!exists) {
          updated.push(file);
        }
      }
      return updated;
    });
  }

  function removeAttachment(index) {
    setAttachments((current) => current.filter((_, i) => i !== index));
    setAttachmentError('');
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer?.files) {
      handleFilesAdded(e.dataTransfer.files);
    }
  }

  async function submitGeneration(event) {
    event.preventDefault();
    const brief = {
      objective: objective.trim() || null,
      audience: audience.trim() || null,
      desiredLength: desiredLength || null,
      tone: tone.trim() || null,
      references: parseReferences(referencesText),
    };
    const validationMessage = validateInput(topic, brief);
    setInputError(validationMessage);
    if (validationMessage) return;

    const controller = new AbortController();
    controllerRef.current = controller;
    setRequestError('');
    setRequestState('generating');

    try {
      const normalizedTopic = topic.trim();
      const result = await generateReport(
        { topic: normalizedTopic, brief },
        { signal: controller.signal, attachments },
      );
      const generated = validateGeneratedReport(result, normalizedTopic);
      const draft = {
        ...generated,
        selectedFormats: Array.isArray(configuration?.selectedFormats)
          ? configuration.selectedFormats
          : generated.selectedFormats,
        pdfTemplateId: configuration && Object.hasOwn(configuration, 'pdfTemplateId')
          ? configuration.pdfTemplateId
          : generated.pdfTemplateId,
      };

      try {
        await saveReportDraft(draft, new Map());
        navigate(`/relatorios/novo/${draft.id}`, { state: { mode: 'manual' } });
      } catch (error) {
        navigate(`/relatorios/novo/${draft.id}`, {
          state: {
            mode: 'manual',
            initialDraft: draft,
            initialSaveError: error.message,
          },
        });
      }
    } catch (error) {
      if (error.name === 'AbortError' || controller.signal.aborted) {
        setRequestState('cancelled');
      } else {
        setRequestError(error.message);
        setRequestState('error');
      }
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null;
    }
  }

  function cancelGeneration() {
    controllerRef.current?.abort();
  }

  return (
    <FormularioGeracaoStl onSubmit={submitGeneration} data-testid="formulario-geracao-ia">
      <div>
        <TituloGeracaoStl>Começar com IA</TituloGeracaoStl>
        <TextoGeracaoStl>Informe o tema e os parâmetros para criar um primeiro rascunho editável.</TextoGeracaoStl>
      </div>
      <CampoGeracaoStl>
        Tema do relatório
        <InputGeracaoStl
          aria-label="Tema para geração"
          maxLength={500}
          required
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
        />
      </CampoGeracaoStl>
      <GradeCamposGeracaoStl>
        <CampoGeracaoStl>
          Objetivo (opcional)
          <TextoAreaGeracaoStl
            aria-label="Objetivo da geração"
            maxLength={2000}
            value={objective}
            onChange={(event) => setObjective(event.target.value)}
          />
        </CampoGeracaoStl>
        <CampoGeracaoStl>
          Público-alvo (opcional)
          <TextoAreaGeracaoStl
            aria-label="Público-alvo da geração"
            maxLength={2000}
            value={audience}
            onChange={(event) => setAudience(event.target.value)}
          />
        </CampoGeracaoStl>
        <CampoGeracaoStl>
          Extensão desejada
          <SelectGeracaoStl
            aria-label="Extensão desejada para geração"
            value={desiredLength}
            onChange={(event) => setDesiredLength(event.target.value)}
          >
            <option value="">Não selecionada</option>
            <option value="short">Curta</option>
            <option value="medium">Média</option>
            <option value="long">Longa</option>
          </SelectGeracaoStl>
        </CampoGeracaoStl>
        <CampoGeracaoStl>
          Tom (opcional)
          <InputGeracaoStl
            aria-label="Tom da geração"
            maxLength={2000}
            value={tone}
            onChange={(event) => setTone(event.target.value)}
          />
        </CampoGeracaoStl>
      </GradeCamposGeracaoStl>
      <CampoGeracaoStl>
        Fontes e referências (uma por linha, até 10)
        <TextoAreaGeracaoStl
          aria-label="Referências da geração"
          maxLength={5000}
          value={referencesText}
          onChange={(event) => setReferencesText(event.target.value)}
        />
      </CampoGeracaoStl>

      <CampoGeracaoStl>
        Documentos e planilhas de contexto (opcional)
        <ZonaDropUploadStl
          $isDragging={isDragging}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          role="region"
          aria-label="Área para anexar arquivos de contexto"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          data-testid="zona-drop-anexos"
        >
          <InputOcultoUploadStl
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.xlsx,.csv,.png,.jpg,.jpeg,.webp"
            aria-label="Selecionar arquivos de contexto"
            onChange={(e) => {
              if (e.target.files) {
                handleFilesAdded(e.target.files);
                e.target.value = '';
              }
            }}
          />
          <TextoGeracaoStl style={{ margin: 0, fontWeight: 600 }}>
            {isDragging ? 'Solte os arquivos para anexar' : 'Arraste arquivos aqui ou clique para selecionar'}
          </TextoGeracaoStl>
          <TextoAjudaAnexoStl>
            Até 3 arquivos (PDF, XLSX, CSV, PNG, JPG, WebP) com no máximo 15 MiB no total.
          </TextoAjudaAnexoStl>
        </ZonaDropUploadStl>
      </CampoGeracaoStl>

      {attachments.length > 0 && (
        <ListaAnexosStl aria-label="Arquivos anexados" data-testid="lista-anexos-ia">
          {attachments.map((file, index) => {
            const ext = getFileExtension(file.name);
            return (
              <ChipAnexoStl key={`${file.name}-${file.size}-${index}`} data-testid={`chip-anexo-${index}`}>
                <BadgeTipoAnexoStl>{getFileTypeBadge(ext)}</BadgeTipoAnexoStl>
                <NomeAnexoStl title={file.name}>{file.name}</NomeAnexoStl>
                <TamanhoAnexoStl>({formatFileSize(file.size)})</TamanhoAnexoStl>
                <BotaoRemoverAnexoStl
                  type="button"
                  aria-label={`Remover anexo ${file.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeAttachment(index);
                  }}
                >
                  ✕
                </BotaoRemoverAnexoStl>
              </ChipAnexoStl>
            );
          })}
        </ListaAnexosStl>
      )}

      {attachmentError && (
        <ErroGeracaoStl role="alert" data-testid="erro-anexo">
          {attachmentError}
        </ErroGeracaoStl>
      )}

      <TextoGeracaoStl>
        Ao solicitar a geração, tema, parâmetros e anexos serão enviados à API de IA.
        Formatos: {configuration?.selectedFormats?.length
          ? configuration.selectedFormats.map((format) => formatLabels[format] || format).join(', ')
          : 'escolha depois'}.
        {' '}Modelo PDF: {configuration?.pdfTemplateName || 'nenhum selecionado'}.
        {attachments.length > 0 && ` Anexos selecionados: ${attachments.length}.`}
      </TextoGeracaoStl>

      {inputError && <ErroGeracaoStl role="alert">{inputError}</ErroGeracaoStl>}
      {requestError && <ErroGeracaoStl role="alert">{requestError}</ErroGeracaoStl>}
      {requestState === 'generating' && (
        <TextoGeracaoStl role="status">Gerando um rascunho estruturado. Isso pode levar alguns instantes…</TextoGeracaoStl>
      )}
      {requestState === 'cancelled' && (
        <TextoGeracaoStl role="status">Geração cancelada. Nenhum rascunho foi substituído.</TextoGeracaoStl>
      )}
      <AcoesGeracaoStl>
        <BotaoGeracaoStl type="submit" $primary disabled={requestState === 'generating'}>
          {requestState === 'error' ? 'Tentar novamente' : 'Gerar relatório'}
        </BotaoGeracaoStl>
        {requestState === 'generating' && (
          <BotaoGeracaoStl type="button" onClick={cancelGeneration}>Cancelar geração</BotaoGeracaoStl>
        )}
        <BotaoGeracaoStl
          type="button"
          onClick={() => navigate('/')}
          disabled={requestState === 'generating'}
        >Voltar para o início</BotaoGeracaoStl>
      </AcoesGeracaoStl>
    </FormularioGeracaoStl>
  );
}
