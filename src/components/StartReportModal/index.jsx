import { useEffect, useRef, useState } from 'react';
import { fetchPublicTemplates } from '../../services/api.js';
import {
  AcoesModalStl,
  BotaoFecharModalStl,
  BotaoModalPrimarioStl,
  BotaoModalSecundarioStl,
  CabecalhoModalStl,
  ConteudoModalStl,
  DialogIniciarStl,
  FormatoCardStl,
  GrupoOpcoesStl,
  LegendaOpcoesStl,
  ListaFormatosStl,
  MensagemEstadoStl,
  OpcaoCardStl,
  SelecaoModeloStl,
  TextoModalStl,
  TextoOpcaoStl,
  TituloModalStl,
} from './styles.js';

const formatOptions = [
  { id: 'pdf', label: 'PDF' },
  { id: 'docx', label: 'DOCX' },
  { id: 'markdown', label: 'Markdown' },
];

export default function StartReportModal({ isOpen, onOpenChange, onStart }) {
  const dialogRef = useRef(null);
  const [mode, setMode] = useState('manual');
  const [selectedFormats, setSelectedFormats] = useState(['pdf']);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [templatesError, setTemplatesError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    let isCurrent = true;
    setIsLoadingTemplates(true);
    setTemplates([]);
    setSelectedTemplateId('');
    setTemplatesError('');

    fetchPublicTemplates()
      .then((availableTemplates) => {
        if (!isCurrent) return;
        setTemplates(availableTemplates);
        setSelectedTemplateId((current) => (
          availableTemplates.some((template) => template.id === current)
            ? current
            : availableTemplates[0]?.id || ''
        ));
      })
      .catch((error) => {
        if (!isCurrent) return;
        setTemplates([]);
        setSelectedTemplateId('');
        setTemplatesError(error.message);
      })
      .finally(() => {
        if (isCurrent) setIsLoadingTemplates(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [isOpen, retryCount]);

  function toggleFormat(format) {
    setSelectedFormats((current) => (
      current.includes(format)
        ? current.filter((item) => item !== format)
        : [...current, format]
    ));
  }

  function handleBackdropClick(event) {
    const dialog = dialogRef.current;
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    const outsideDialog = event.clientX < bounds.left
      || event.clientX > bounds.right
      || event.clientY < bounds.top
      || event.clientY > bounds.bottom;
    if (outsideDialog) onOpenChange(false);
  }

  return (
    <DialogIniciarStl
      ref={dialogRef}
      aria-labelledby="modal-iniciar-titulo"
      aria-describedby="modal-iniciar-descricao"
      onClose={() => onOpenChange(false)}
      onClick={handleBackdropClick}
      data-testid="modal-iniciar-relatorio"
    >
      <ConteudoModalStl>
        <CabecalhoModalStl>
          <div>
            <TituloModalStl id="modal-iniciar-titulo">Iniciar novo relatório</TituloModalStl>
            <TextoModalStl id="modal-iniciar-descricao">
              Escolha como começar. Você poderá revisar e editar o conteúdo antes de exportar.
            </TextoModalStl>
          </div>
          <BotaoFecharModalStl
            type="button"
            aria-label="Fechar"
            onClick={() => onOpenChange(false)}
            autoFocus
          >
            Fechar
          </BotaoFecharModalStl>
        </CabecalhoModalStl>

        <GrupoOpcoesStl>
          <LegendaOpcoesStl>Como deseja começar?</LegendaOpcoesStl>
          <OpcaoCardStl>
            <input
              type="radio"
              name="report-mode"
              value="manual"
              checked={mode === 'manual'}
              onChange={() => setMode('manual')}
            />
            <TextoOpcaoStl>
              <strong>Escrever manualmente</strong>
              <small>Comece com uma estrutura vazia e escreva suas seções.</small>
            </TextoOpcaoStl>
          </OpcaoCardStl>
          <OpcaoCardStl>
            <input
              type="radio"
              name="report-mode"
              value="ai"
              checked={mode === 'ai'}
              onChange={() => setMode('ai')}
            />
            <TextoOpcaoStl>
              <strong>Começar com IA</strong>
              <small>Gere uma primeira versão para revisar e editar.</small>
            </TextoOpcaoStl>
          </OpcaoCardStl>
        </GrupoOpcoesStl>

        <GrupoOpcoesStl>
          <LegendaOpcoesStl>Formatos para exportação (opcional)</LegendaOpcoesStl>
          <ListaFormatosStl>
            {formatOptions.map((format) => (
              <FormatoCardStl key={format.id}>
                <input
                  type="checkbox"
                  name="report-formats"
                  value={format.id}
                  checked={selectedFormats.includes(format.id)}
                  onChange={() => toggleFormat(format.id)}
                />
                {format.label}
              </FormatoCardStl>
            ))}
          </ListaFormatosStl>
        </GrupoOpcoesStl>

        <GrupoOpcoesStl>
          <LegendaOpcoesStl>Modelo de PDF</LegendaOpcoesStl>
          <SelecaoModeloStl
            aria-label="Modelo de PDF"
            value={selectedTemplateId}
            disabled={isLoadingTemplates || templates.length === 0}
            onChange={(event) => setSelectedTemplateId(event.target.value)}
          >
            {templates.length === 0 && <option value="">Nenhum modelo disponível</option>}
            {templates.map((template) => (
              <option key={template.id} value={template.id}>{template.name}</option>
            ))}
          </SelecaoModeloStl>
          {isLoadingTemplates && (
            <MensagemEstadoStl role="status">Carregando modelos PDF publicados…</MensagemEstadoStl>
          )}
          {templatesError && (
            <MensagemEstadoStl role="alert" $isError>
              Não foi possível carregar os modelos: {templatesError}
            </MensagemEstadoStl>
          )}
          {!isLoadingTemplates && !templatesError && templates.length === 0 && (
            <MensagemEstadoStl role="status">
              Nenhum modelo publicado disponível. Você ainda pode iniciar e escolher depois.
            </MensagemEstadoStl>
          )}
          {templatesError && (
            <BotaoModalSecundarioStl
              type="button"
              onClick={() => setRetryCount((current) => current + 1)}
            >
              Tentar novamente
            </BotaoModalSecundarioStl>
          )}
        </GrupoOpcoesStl>

        <AcoesModalStl>
          <BotaoModalSecundarioStl type="button" onClick={() => onOpenChange(false)}>
            Cancelar
          </BotaoModalSecundarioStl>
          <BotaoModalPrimarioStl
            type="button"
            disabled={isLoadingTemplates}
            onClick={() => onStart({
              mode,
              selectedFormats,
              pdfTemplateId: selectedTemplateId || null,
              pdfTemplateName: templates.find((template) => template.id === selectedTemplateId)?.name || null,
            })}
          >
            Continuar
          </BotaoModalPrimarioStl>
        </AcoesModalStl>
      </ConteudoModalStl>
    </DialogIniciarStl>
  );
}
