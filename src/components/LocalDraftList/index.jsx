import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteReportDraft, listReportDrafts } from '../../services/reportDrafts.js';
import {
  AcoesRascunhoStl,
  BotaoRascunhoStl,
  CartaoRascunhoStl,
  BotaoRetomarStl,
  ListaRascunhosStl,
  TextoRascunhoStl,
  TituloRascunhosStl,
} from './styles.js';

function formatUpdatedAt(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Data indisponível' : date.toLocaleString('pt-BR');
}

export default function LocalDraftList() {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const refreshDrafts = useCallback(async () => {
    setIsLoading(true);
    try {
      setDrafts(await listReportDrafts());
      setError('');
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshDrafts();
  }, [refreshDrafts]);

  async function removeDraft(draft) {
    if (!window.confirm(`Remover o rascunho “${draft.title}” e suas imagens deste navegador?`)) return;
    try {
      await deleteReportDraft(draft.id);
      setDrafts((current) => current.filter((item) => item.id !== draft.id));
      setError('');
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  return (
    <ListaRascunhosStl aria-labelledby="titulo-rascunhos" data-testid="lista-rascunhos">
      <TituloRascunhosStl id="titulo-rascunhos">Seus rascunhos neste navegador</TituloRascunhosStl>
      <TextoRascunhoStl>Até 10 rascunhos ficam disponíveis somente neste navegador e dispositivo.</TextoRascunhoStl>
      {isLoading && <TextoRascunhoStl role="status">Carregando rascunhos…</TextoRascunhoStl>}
      {error && (
        <div role="alert">
          <TextoRascunhoStl>{error}</TextoRascunhoStl>
          <BotaoRascunhoStl type="button" onClick={refreshDrafts}>Tentar novamente</BotaoRascunhoStl>
        </div>
      )}
      {!isLoading && !error && drafts.length === 0 && (
        <TextoRascunhoStl>Nenhum rascunho salvo ainda.</TextoRascunhoStl>
      )}
      {!error && drafts.map((draft) => (
        <CartaoRascunhoStl key={draft.id}>
          <div>
            <strong>{draft.title || 'Relatório sem título'}</strong>
            <TextoRascunhoStl>{draft.topic || 'Tema ainda não informado'}</TextoRascunhoStl>
            <TextoRascunhoStl>Atualizado em {formatUpdatedAt(draft.updatedAt)}</TextoRascunhoStl>
          </div>
          <AcoesRascunhoStl>
            <BotaoRetomarStl
              type="button"
              onClick={() => navigate(`/relatorios/novo/${draft.id}`, { state: { mode: 'manual' } })}
            >Retomar rascunho</BotaoRetomarStl>
            <BotaoRascunhoStl
              type="button"
              $variant="outline"
              onClick={() => removeDraft(draft)}
            >Remover rascunho</BotaoRascunhoStl>
          </AcoesRascunhoStl>
        </CartaoRascunhoStl>
      ))}
    </ListaRascunhosStl>
  );
}
