import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  generateReport,
  validateGeneratedReport,
} from '../../services/api.js';
import { saveReportDraft } from '../../services/reportDrafts.js';
import {
  AcoesGeracaoStl,
  BotaoGeracaoStl,
  CampoGeracaoStl,
  ErroGeracaoStl,
  FormularioGeracaoStl,
  GradeCamposGeracaoStl,
  InputGeracaoStl,
  SelectGeracaoStl,
  TextoAreaGeracaoStl,
  TextoGeracaoStl,
  TituloGeracaoStl,
} from './styles.js';

const formatLabels = { pdf: 'PDF', docx: 'DOCX', markdown: 'Markdown' };

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
  const [topic, setTopic] = useState('');
  const [objective, setObjective] = useState('');
  const [audience, setAudience] = useState('');
  const [desiredLength, setDesiredLength] = useState('medium');
  const [tone, setTone] = useState('');
  const [referencesText, setReferencesText] = useState('');
  const [requestState, setRequestState] = useState('idle');
  const [requestError, setRequestError] = useState('');
  const [inputError, setInputError] = useState('');

  useEffect(() => () => controllerRef.current?.abort(), []);

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
      const result = await generateReport({ topic: normalizedTopic, brief }, { signal: controller.signal });
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
      <TextoGeracaoStl>
        Ao solicitar a geração, tema e parâmetros serão enviados à API. Imagens não são enviadas à IA.
        Formatos: {configuration?.selectedFormats?.length
          ? configuration.selectedFormats.map((format) => formatLabels[format] || format).join(', ')
          : 'escolha depois'}.
        {' '}Modelo PDF: {configuration?.pdfTemplateName || 'nenhum selecionado'}.
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
