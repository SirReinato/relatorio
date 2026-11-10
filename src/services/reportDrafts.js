const DATABASE_NAME = 'sir68-report-drafts';
const DATABASE_VERSION = 1;
const MAX_DRAFTS = 10;

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_REPORT_IMAGE_BYTES = 20 * 1024 * 1024;
export const MAX_IMAGE_PIXELS = 12 * 1000 * 1000;
export const MAX_IMAGE_DIMENSION = 5000;

let databasePromise;

function storageError(error) {
  if (error?.name === 'QuotaExceededError') {
    return new Error('O armazenamento local está cheio. O rascunho continua disponível nesta tela, mas as alterações recentes não foram salvas. Remova rascunhos ou imagens para liberar espaço.');
  }

  if (error instanceof Error && error.message.startsWith('Limite de rascunhos')) {
    return error;
  }

  if (error?.name === 'SecurityError' || error?.name === 'InvalidStateError') {
    return new Error('O armazenamento local está indisponível neste navegador. O rascunho continua disponível nesta tela, mas não será retomado depois.');
  }

  if (error?.message?.includes('IndexedDB indisponível') || error?.message?.includes('IndexedDB bloqueado')) {
    return new Error('O armazenamento local está indisponível neste navegador. O rascunho continua disponível nesta tela, mas não será retomado depois.');
  }

  return new Error('Não foi possível salvar ou carregar o rascunho local. O conteúdo permanece disponível nesta tela; verifique o armazenamento do navegador e tente novamente.');
}

function openDatabase() {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(storageError(new Error('IndexedDB indisponível')));
  }

  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      let request;
      try {
        request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
      } catch (error) {
        reject(storageError(error));
        return;
      }

      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains('drafts')) {
          database.createObjectStore('drafts', { keyPath: 'id' });
        }
        if (!database.objectStoreNames.contains('images')) {
          const images = database.createObjectStore('images', { keyPath: ['reportId', 'id'] });
          images.createIndex('reportId', 'reportId', { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(storageError(request.error));
      request.onblocked = () => reject(storageError(new Error('IndexedDB bloqueado')));
    }).catch((error) => {
      databasePromise = undefined;
      throw error;
    });
  }

  return databasePromise;
}

function runTransaction(database, stores, mode, run) {
  return new Promise((resolve, reject) => {
    let transaction;
    let result;
    let operationError;

    try {
      transaction = database.transaction(stores, mode);
    } catch (error) {
      reject(storageError(error));
      return;
    }

    transaction.oncomplete = () => resolve(result);
    transaction.onerror = () => reject(storageError(operationError || transaction.error));
    transaction.onabort = () => reject(storageError(operationError || transaction.error));

    const fail = (error) => {
      operationError = error;
      try {
        transaction.abort();
      } catch {
        reject(storageError(error));
      }
    };

    try {
      run(transaction, (value) => {
        result = value;
      }, fail);
    } catch (error) {
      fail(error);
    }
  });
}

export async function listReportDrafts() {
  const database = await openDatabase();
  return runTransaction(database, ['drafts'], 'readonly', (transaction, setResult) => {
    const request = transaction.objectStore('drafts').getAll();
    request.onsuccess = () => {
      setResult(request.result.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)));
    };
  });
}

export async function loadReportDraft(id) {
  const database = await openDatabase();
  return runTransaction(database, ['drafts', 'images'], 'readonly', (transaction, setResult) => {
    const draftRequest = transaction.objectStore('drafts').get(id);
    const imagesRequest = transaction.objectStore('images').index('reportId').getAll(id);
    let draft;
    let images;

    draftRequest.onsuccess = () => {
      draft = draftRequest.result;
      if (images !== undefined) setResult(draft ? { draft, images } : null);
    };
    imagesRequest.onsuccess = () => {
      images = imagesRequest.result.map(({ id: imageId, blob }) => [imageId, blob]);
      if (draftRequest.readyState === 'done') setResult(draft ? { draft, images } : null);
    };
  });
}

export async function saveReportDraft(draft, imageBlobs = new Map()) {
  const database = await openDatabase();
  return runTransaction(database, ['drafts', 'images'], 'readwrite', (transaction, setResult, fail) => {
    const draftStore = transaction.objectStore('drafts');
    const imageStore = transaction.objectStore('images');
    const draftsRequest = draftStore.getAll();
    const imagesRequest = imageStore.index('reportId').getAll(draft.id);
    const referencedImages = new Set(draft.sections.flatMap((section) => section.images.map((image) => image.id)));
    let draftsSaved = false;
    let imagesSaved = false;

    draftsRequest.onsuccess = () => {
      const currentDrafts = draftsRequest.result;
      const isNewDraft = !currentDrafts.some((savedDraft) => savedDraft.id === draft.id);
      if (isNewDraft && currentDrafts.length >= MAX_DRAFTS) {
        fail(new Error('Limite de rascunhos locais atingido. Remova um rascunho antigo antes de criar outro.'));
        return;
      }

      draftStore.put(draft);
      draftsSaved = true;
      if (imagesSaved) setResult(draft);
    };

    imagesRequest.onsuccess = () => {
      for (const { id } of imagesRequest.result) {
        if (!referencedImages.has(id)) imageStore.delete([draft.id, id]);
      }

      for (const imageId of referencedImages) {
        const blob = imageBlobs.get(imageId);
        if (blob) imageStore.put({ reportId: draft.id, id: imageId, blob });
      }

      imagesSaved = true;
      if (draftsSaved) setResult(draft);
    };
  });
}

export async function deleteReportDraft(id) {
  const database = await openDatabase();
  return runTransaction(database, ['drafts', 'images'], 'readwrite', (transaction, setResult) => {
    transaction.objectStore('drafts').delete(id);
    const images = transaction.objectStore('images');
    const request = images.index('reportId').getAllKeys(id);
    request.onsuccess = () => {
      for (const imageId of request.result) images.delete(imageId);
      setResult(undefined);
    };
  });
}
