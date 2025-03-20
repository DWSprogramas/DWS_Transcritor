// Configuração do Firebase
// Substitua com as credenciais do seu projeto Firebase
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "seu-projeto.firebaseapp.com",
  databaseURL: "https://seu-projeto.firebaseio.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "seu-id-de-mensagem",
  appId: "seu-app-id"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);

// Exporta os serviços específicos para usar em outros arquivos
const auth = firebase.auth();
const db = firebase.database();

// Verificar o estado de autenticação
auth.onAuthStateChanged((user) => {
  if (user) {
    // Usuário está logado
    console.log('Usuário logado:', user.uid);
    // Mostrar interface de usuário logado
    document.querySelectorAll('.auth-logged-in').forEach(el => el.style.display = 'block');
    document.querySelectorAll('.auth-logged-out').forEach(el => el.style.display = 'none');
    
    // Carregar dados do usuário se necessário
    loadUserData(user.uid);
  } else {
    // Usuário não está logado
    console.log('Usuário não logado');
    // Mostrar interface de login
    document.querySelectorAll('.auth-logged-in').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.auth-logged-out').forEach(el => el.style.display = 'block');
    
    // Verificar se estamos na página principal e redirecionar para login se for o caso
    if (window.location.pathname.endsWith('/index.html') || window.location.pathname.endsWith('/')) {
      if (!window.location.pathname.includes('login.html')) {
        // Redirecionar para a página de login
        window.location.href = './login.html';
      }
    }
  }
});

// Função para carregar dados do usuário
function loadUserData(userId) {
  // Referência para o nó do usuário no banco de dados
  const userRef = db.ref('users/' + userId);
  
  // Buscar os dados do usuário
  userRef.once('value')
    .then((snapshot) => {
      const userData = snapshot.val();
      if (userData) {
        console.log('Dados do usuário carregados:', userData);
        // Você pode atualizar a interface com os dados do usuário aqui
        if (userData.apiKey) {
          const apiKeyInput = document.getElementById('apiKey');
          if (apiKeyInput) {
            apiKeyInput.value = userData.apiKey;
          }
        }
      } else {
        console.log('Nenhum dado encontrado para este usuário');
        // Criar registro de usuário caso não exista
        createUserData(userId);
      }
    })
    .catch((error) => {
      console.error('Erro ao carregar dados do usuário:', error);
    });
}

// Função para criar dados iniciais do usuário
function createUserData(userId) {
  const userData = {
    createdAt: firebase.database.ServerValue.TIMESTAMP,
    transcriptions: {}
  };
  
  db.ref('users/' + userId).set(userData)
    .then(() => {
      console.log('Dados iniciais do usuário criados');
    })
    .catch((error) => {
      console.error('Erro ao criar dados do usuário:', error);
    });
}

// Função para salvar a API key do usuário
function saveUserApiKey(apiKey) {
  const user = auth.currentUser;
  if (!user) {
    console.error('Usuário não está logado');
    return Promise.reject(new Error('Usuário não está logado'));
  }
  
  return db.ref('users/' + user.uid).update({
    apiKey: apiKey
  });
}

// Função para salvar uma transcrição
function saveTranscription(transcriptionData) {
  const user = auth.currentUser;
  if (!user) {
    console.error('Usuário não está logado');
    return Promise.reject(new Error('Usuário não está logado'));
  }
  
  // Criar um ID único para a transcrição
  const transcriptionId = db.ref().child('users/' + user.uid + '/transcriptions').push().key;
  
  // Dados completos da transcrição
  const transcription = {
    id: transcriptionId,
    text: transcriptionData.text,
    processedText: transcriptionData.processedText,
    processingType: transcriptionData.processingType,
    createdAt: firebase.database.ServerValue.TIMESTAMP,
    title: transcriptionData.title || 'Transcrição ' + new Date().toLocaleString()
  };
  
  // Criar uma atualização para salvar
  const updates = {};
  updates['users/' + user.uid + '/transcriptions/' + transcriptionId] = transcription;
  
  // Salvar no banco de dados
  return db.ref().update(updates);
}

// Função para buscar todas as transcrições do usuário
function getUserTranscriptions() {
  const user = auth.currentUser;
  if (!user) {
    console.error('Usuário não está logado');
    return Promise.reject(new Error('Usuário não está logado'));
  }
  
  return db.ref('users/' + user.uid + '/transcriptions')
    .orderByChild('createdAt')
    .once('value')
    .then((snapshot) => {
      const transcriptions = [];
      snapshot.forEach((childSnapshot) => {
        transcriptions.push(childSnapshot.val());
      });
      return transcriptions.reverse(); // Mais recentes primeiro
    });
}

// Função para excluir uma transcrição
function deleteTranscription(transcriptionId) {
  const user = auth.currentUser;
  if (!user) {
    console.error('Usuário não está logado');
    return Promise.reject(new Error('Usuário não está logado'));
  }
  
  return db.ref('users/' + user.uid + '/transcriptions/' + transcriptionId).remove();
}

// Função para atualizar uma transcrição
function updateTranscription(transcriptionId, updatedData) {
  const user = auth.currentUser;
  if (!user) {
    console.error('Usuário não está logado');
    return Promise.reject(new Error('Usuário não está logado'));
  }
  
  return db.ref('users/' + user.uid + '/transcriptions/' + transcriptionId).update(updatedData);
}

// Exportar funções para uso em outros scripts
window.firebaseHelper = {
  auth,
  db,
  saveUserApiKey,
  saveTranscription,
  getUserTranscriptions,
  deleteTranscription,
  updateTranscription
};
