import { useEffect, useState } from 'react';
import {
  cloneAdminTemplate,
  createAdminTemplate,
  deleteAdminTemplate,
  previewAdminTemplate,
  publishAdminTemplate,
  unpublishAdminTemplate,
  updateAdminTemplate,
} from '../../services/api.js';
import ThemeBuilder from './ThemeBuilder.jsx';
import {
  DEFAULT_THEME_CONFIG,
  compileThemeToHtmlAndCss,
} from './themeCompiler.js';
import {
  AbaModoStl,
  AcoesModeloStl,
  AreaModeloStl,
  BotaoModeloStl,
  CabecalhoCartaoModeloStl,
  CabecalhoModelosStl,
  CampoModeloStl,
  CartaoModeloStl,
  FormularioModeloStl,
  FramePreviaModeloStl,
  GerenciadorModelosStl,
  InputModeloStl,
  ListaModelosStl,
  MensagemModeloStl,
  PainelModoEditorStl,
  PainelPreviaModeloStl,
  StatusModeloStl,
  TextoAjudaModeloStl,
  TituloModelosStl,
} from './styles.js';

const initialCompiled = compileThemeToHtmlAndCss(DEFAULT_THEME_CONFIG);

const EMPTY_TEMPLATE = {
  name: '',
  description: '',
  html: initialCompiled.html,
  css: initialCompiled.css,
};

function templateValues(template) {
  return {
    name: template.name,
    description: template.description,
    html: template.html,
    css: template.css,
  };
}

export default function AdminTemplateManager({
  templates,
  onTemplatesChanged,
  onUnauthorized,
}) {
  const [form, setForm] = useState(EMPTY_TEMPLATE);
  const [editingId, setEditingId] = useState('');
  const [editorMode, setEditorMode] = useState('visual');
  const [visualConfig, setVisualConfig] = useState(DEFAULT_THEME_CONFIG);
  const [codeModifiedManually, setCodeModifiedManually] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [busyTemplateId, setBusyTemplateId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    if (!previewUrl) return undefined;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function handleError(error) {
    if (error.statusCode === 401) {
      onUnauthorized();
      return;
    }
    setErrorMessage(error.message);
  }

  function resetForm() {
    const compiled = compileThemeToHtmlAndCss(DEFAULT_THEME_CONFIG);
    setForm({
      name: '',
      description: '',
      html: compiled.html,
      css: compiled.css,
    });
    setVisualConfig(DEFAULT_THEME_CONFIG);
    setEditorMode('visual');
    setCodeModifiedManually(false);
    setEditingId('');
    setErrorMessage('');
    setStatusMessage('');
  }

  function editTemplate(template) {
    setEditingId(template.id);
    setForm(templateValues(template));
    setEditorMode('code');
    setCodeModifiedManually(true);
    setErrorMessage('');
    setStatusMessage(`Editando ${template.name}. Salve como rascunho antes de publicar.`);
  }

  function handleVisualConfigChange(newConfig) {
    setVisualConfig(newConfig);
    const compiled = compileThemeToHtmlAndCss(newConfig);
    setForm((current) => ({
      ...current,
      html: compiled.html,
      css: compiled.css,
    }));
  }

  function handleModeSwitch(targetMode) {
    if (targetMode === editorMode) return;
    if (targetMode === 'visual' && codeModifiedManually) {
      const confirmSwitch = window.confirm(
        'Voltar ao Configurador Visual substituirá as edições manuais em HTML e CSS pela compilação do tema. Deseja continuar?'
      );
      if (!confirmSwitch) return;
      const compiled = compileThemeToHtmlAndCss(visualConfig);
      setForm((current) => ({
        ...current,
        html: compiled.html,
        css: compiled.css,
      }));
      setCodeModifiedManually(false);
    }
    setEditorMode(targetMode);
  }

  async function loadPreview(templateId) {
    setErrorMessage('');
    setStatusMessage('');
    setBusyTemplateId(templateId);
    try {
      const pdf = await previewAdminTemplate(templateId);
      setPreviewUrl(URL.createObjectURL(pdf));
      setStatusMessage('Prévia PDF pronta. O conteúdo foi renderizado pela API em um documento isolado.');
    } catch (error) {
      handleError(error);
    } finally {
      setBusyTemplateId('');
    }
  }

  async function saveTemplate(previewAfterSave = false) {
    setErrorMessage('');
    setStatusMessage('');
    setIsWorking(true);
    try {
      const saved = editingId
        ? await updateAdminTemplate(editingId, form)
        : await createAdminTemplate(form);
      setEditingId(saved.id);
      setForm(templateValues(saved));
      setStatusMessage(`Rascunho "${saved.name}" salvo.`);
      onTemplatesChanged();
      if (previewAfterSave) await loadPreview(saved.id);
    } catch (error) {
      handleError(error);
    } finally {
      setIsWorking(false);
    }
  }

  async function changeTemplateStatus(template, publish) {
    setErrorMessage('');
    setStatusMessage('');
    setBusyTemplateId(template.id);
    try {
      const updated = publish
        ? await publishAdminTemplate(template.id)
        : await unpublishAdminTemplate(template.id);
      setStatusMessage(`Modelo "${updated.name}" ${publish ? 'publicado' : 'despublicado'}.`);
      onTemplatesChanged();
    } catch (error) {
      handleError(error);
    } finally {
      setBusyTemplateId('');
    }
  }

  async function removeTemplate(template) {
    if (!window.confirm(`Excluir o rascunho "${template.name}" permanentemente?`)) return;
    setErrorMessage('');
    setStatusMessage('');
    setBusyTemplateId(template.id);
    try {
      await deleteAdminTemplate(template.id);
      if (editingId === template.id) resetForm();
      setStatusMessage(`Rascunho "${template.name}" excluído.`);
      onTemplatesChanged();
    } catch (error) {
      handleError(error);
    } finally {
      setBusyTemplateId('');
    }
  }

  async function cloneTemplate(template) {
    setErrorMessage('');
    setStatusMessage('');
    setBusyTemplateId(template.id);
    try {
      const cloned = await cloneAdminTemplate(template.id);
      onTemplatesChanged();
      setEditingId(cloned.id);
      setForm(templateValues(cloned));
      setStatusMessage(`Modelo "${template.name}" duplicado com sucesso como "${cloned.name}". Salve como rascunho antes de publicar.`);
    } catch (error) {
      handleError(error);
    } finally {
      setBusyTemplateId('');
    }
  }

  return (
    <GerenciadorModelosStl data-testid="gerenciador-modelos">
      <CabecalhoModelosStl>
        <TituloModelosStl>Modelos PDF</TituloModelosStl>
        <p>Crie rascunhos, revise uma prévia e publique apenas modelos validados.</p>
      </CabecalhoModelosStl>

      <FormularioModeloStl
        onSubmit={(event) => {
          event.preventDefault();
          saveTemplate();
        }}
        data-testid="formulario-modelo-pdf"
      >
        <TituloModelosStl>{editingId ? 'Editar rascunho' : 'Novo modelo PDF'}</TituloModelosStl>
        <CampoModeloStl>
          Nome
          <InputModeloStl
            aria-label="Nome do modelo"
            autoComplete="off"
            maxLength={100}
            required
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          />
        </CampoModeloStl>
        <CampoModeloStl>
          Descrição
          <InputModeloStl
            aria-label="Descrição do modelo"
            maxLength={500}
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
          />
        </CampoModeloStl>

        <PainelModoEditorStl role="tablist" aria-label="Modo de edição do modelo">
          <AbaModoStl
            type="button"
            role="tab"
            aria-selected={editorMode === 'visual'}
            $active={editorMode === 'visual'}
            onClick={() => handleModeSwitch('visual')}
            data-testid="aba-modo-visual"
          >
            Configurador Visual
          </AbaModoStl>
          <AbaModoStl
            type="button"
            role="tab"
            aria-selected={editorMode === 'code'}
            $active={editorMode === 'code'}
            onClick={() => handleModeSwitch('code')}
            data-testid="aba-modo-codigo"
          >
            Modo Avançado (HTML/CSS)
          </AbaModoStl>
        </PainelModoEditorStl>

        {editorMode === 'visual' ? (
          <ThemeBuilder
            config={visualConfig}
            onChangeConfig={handleVisualConfigChange}
          />
        ) : (
          <>
            <CampoModeloStl>
              HTML do modelo
              <AreaModeloStl
                aria-label="HTML do modelo"
                maxLength={50 * 1024}
                required
                value={form.html}
                onChange={(event) => {
                  setCodeModifiedManually(true);
                  setForm((current) => ({ ...current, html: event.target.value }));
                }}
              />
            </CampoModeloStl>
            <TextoAjudaModeloStl>
              Placeholders permitidos: <code>{'{{report.title}}'}</code>, <code>{'{{report.topic}}'}</code> e{' '}
              <code>{'{{report.sections}}'}</code>. Use apenas as tags e atributos aceitos pelo servidor;
              scripts e conteúdo executável são rejeitados.
            </TextoAjudaModeloStl>
            <CampoModeloStl>
              CSS do modelo
              <AreaModeloStl
                aria-label="CSS do modelo"
                maxLength={50 * 1024}
                value={form.css}
                onChange={(event) => {
                  setCodeModifiedManually(true);
                  setForm((current) => ({ ...current, css: event.target.value }));
                }}
              />
            </CampoModeloStl>
            <TextoAjudaModeloStl>
              O servidor permite propriedades e seletores CSS restritos e bloqueia regras especiais,
              URLs, JavaScript e carregamento de recursos externos.
            </TextoAjudaModeloStl>
          </>
        )}
        <AcoesModeloStl>
          <BotaoModeloStl type="submit" $primary disabled={isWorking}>
            {isWorking ? 'Salvando…' : 'Salvar rascunho'}
          </BotaoModeloStl>
          <BotaoModeloStl
            type="button"
            disabled={isWorking}
            onClick={() => saveTemplate(true)}
          >Salvar e pré-visualizar PDF</BotaoModeloStl>
          {editingId && (
            <BotaoModeloStl type="button" disabled={isWorking} onClick={resetForm}>
              Cancelar edição
            </BotaoModeloStl>
          )}
        </AcoesModeloStl>
      </FormularioModeloStl>

      {errorMessage && <MensagemModeloStl role="alert" $isError>{errorMessage}</MensagemModeloStl>}
      {statusMessage && <MensagemModeloStl role="status">{statusMessage}</MensagemModeloStl>}

      {templates.length === 0 && (
        <MensagemModeloStl role="status">Nenhum modelo cadastrado. Crie um rascunho para começar.</MensagemModeloStl>
      )}
      <ListaModelosStl aria-label="Modelos PDF cadastrados">
        {templates.map((template) => {
          const isPublished = template.status === 'published';
          const isBusy = busyTemplateId === template.id;
          return (
            <CartaoModeloStl key={template.id} data-testid={`modelo-admin-${template.id}`}>
              <CabecalhoCartaoModeloStl>
                <h3>{template.name}</h3>
                <StatusModeloStl $published={isPublished}>
                  {isPublished ? 'Publicado' : 'Inativo / rascunho'}
                </StatusModeloStl>
              </CabecalhoCartaoModeloStl>
              {template.description && <p>{template.description}</p>}
              <AcoesModeloStl>
                {!isPublished && (
                  <>
                    <BotaoModeloStl
                      type="button"
                      disabled={isWorking || Boolean(busyTemplateId)}
                      onClick={() => editTemplate(template)}
                    >Editar</BotaoModeloStl>
                    <BotaoModeloStl
                      type="button"
                      $primary
                      disabled={isWorking || Boolean(busyTemplateId)}
                      onClick={() => changeTemplateStatus(template, true)}
                    >Publicar</BotaoModeloStl>
                    <BotaoModeloStl
                      type="button"
                      $danger
                      disabled={isWorking || Boolean(busyTemplateId)}
                      onClick={() => removeTemplate(template)}
                    >Excluir rascunho</BotaoModeloStl>
                  </>
                )}
                {isPublished && (
                  <BotaoModeloStl
                    type="button"
                    disabled={isWorking || Boolean(busyTemplateId)}
                    onClick={() => changeTemplateStatus(template, false)}
                  >Despublicar</BotaoModeloStl>
                )}
                <BotaoModeloStl
                  type="button"
                  disabled={isWorking || Boolean(busyTemplateId)}
                  onClick={() => cloneTemplate(template)}
                >Duplicar</BotaoModeloStl>
                <BotaoModeloStl
                  type="button"
                  disabled={isWorking || Boolean(busyTemplateId)}
                  onClick={() => loadPreview(template.id)}
                >{isBusy ? 'Gerando prévia…' : 'Pré-visualizar PDF'}</BotaoModeloStl>
              </AcoesModeloStl>
              {isPublished && (
                <TextoAjudaModeloStl>Despublique o modelo antes de editá-lo ou excluí-lo.</TextoAjudaModeloStl>
              )}
            </CartaoModeloStl>
          );
        })}
      </ListaModelosStl>

      {previewUrl && (
        <PainelPreviaModeloStl aria-label="Prévia do modelo PDF" data-testid="previa-modelo-pdf">
          <CabecalhoCartaoModeloStl>
            <h3>Prévia com dados de exemplo</h3>
            <BotaoModeloStl type="button" onClick={() => setPreviewUrl('')}>Fechar prévia</BotaoModeloStl>
          </CabecalhoCartaoModeloStl>
          <FramePreviaModeloStl
            title="Visualizador PDF do modelo"
            src={previewUrl}
          />
        </PainelPreviaModeloStl>
      )}
    </GerenciadorModelosStl>
  );
}
