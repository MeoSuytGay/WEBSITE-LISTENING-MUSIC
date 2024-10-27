import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getDatabase, ref, set, push, onChildAdded, get, child, remove, onChildRemoved } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import * as Popper from 'https://cdn.jsdelivr.net/npm/@popperjs/core@^2/dist/esm/index.js';

const firebaseConfig = {
  apiKey: "AIzaSyA7u2KzgKS9WviTMIQc6qhgc-HXt5smX7M",
  authDomain: "chat-app-f1-24.firebaseapp.com",
  projectId: "chat-app-f1-24",
  storageBucket: "chat-app-f1-24.appspot.com",
  messagingSenderId: "515361958029",
  appId: "1:515361958029:web:e919b584b9410f8e1b5ac4",
  databaseURL: "https://chat-app-f1-24-default-rtdb.asia-southeast1.firebasedatabase.app"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase();
const dbRef = ref(getDatabase());
const chatsRef = ref(db, 'chats/');

// Tính năng đăng ký
const formRegister = document.querySelector("#form-register");
if(formRegister) {
  formRegister.addEventListener("submit", (event) => {
    event.preventDefault();

    const fullName = event.target.fullName.value;
    const email = event.target.email.value;
    const password = event.target.password.value;

    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        
        set(ref(db, "users/" + user.uid), {
          fullName: fullName
        }).then(() => {
          window.location.href = "index.html";
        });
      })
      .catch((error) => {
        console.log(error);
      });
  });
}

// Tính năng đăng nhập
const formLogin = document.querySelector("#form-login");
if(formLogin) {
  formLogin.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = event.target.email.value;
    const password = event.target.password.value;

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        if(user) {
          window.location.href = "index.html";
        }
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode);
        console.log(errorMessage);
        alert("Tài khoản hoặc mật khẩu không chính xác!");
      });
  })
}

// Tính năng đăng xuất
const buttonLogout = document.querySelector("[button-logout]");
if(buttonLogout) {
  buttonLogout.addEventListener("click", () => {
    signOut(auth).then(() => {
      window.location.href = "login.html";
    }).catch((error) => {
      console.log(error);
    });
  })
}

// Kiểm tra trạng thái đã đăng nhập hay chưa
const chat = document.querySelector(".chat");
const buttonLogin = document.querySelector("[button-login]");
const buttonRegister = document.querySelector("[button-register]");

onAuthStateChanged(auth, (user) => {
  if (user) {
    const uid = user.uid;
    
    buttonLogout.style.display = "inline-block";
    chat.style.display = "block";
  } else {
    buttonLogin.style.display = "inline-block";
    buttonRegister.style.display = "inline-block";
    if(chat) {
      chat.innerHTML = "";
    }
  }
});

// Chat cơ bản (Gửi tin nhắn văn bản)
const formChat = document.querySelector(".chat .inner-form");
if(formChat) {
  // Upload Image
  const upload = new FileUploadWithPreview.FileUploadWithPreview('upload-images', {
    multiple: true,
    maxFileCount: 6
  });
  // End Upload Image

  formChat.addEventListener("submit", async (event) => {
    event.preventDefault();

    const userId = auth.currentUser.uid;
    const content = event.target.content.value;
    const images = upload.cachedFileArray;

    const url = 'https://api.cloudinary.com/v1_1/dxhwpfxxn/image/upload';
    const formData = new FormData();

    const imagesCloud = [];

    for (let i = 0; i < images.length; i++) {
      let file = images[i];
      formData.append('file', file);
      formData.append('upload_preset', 'bl0oe8at');

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      imagesCloud.push(data.url);
    }

    console.log(imagesCloud);

    if(userId && (content || imagesCloud.length > 0)) {
      set(push(ref(db, "chats")), {
        content: content,
        userId: userId,
        images: imagesCloud
      });
      event.target.content.value = "";
      upload.resetPreviewPanel();
    }
  })
}

// Xóa tin nhắn
const buttonDeleteChat = (key) => {
  const buttonDelete = document.querySelector(`[button-delete="${key}"]`);
  buttonDelete.addEventListener("click", () => {
    remove(ref(db, `chats/${key}`));
  });
}

// Lắng nghe sự kiện khi một tin nhắn được xóa
const bodyChat = document.querySelector(".chat .inner-body");
onChildRemoved(chatsRef, (data) => {
  const key = data.key;
  const elementDelete = document.querySelector(`[chat-key="${key}"]`);
  bodyChat.removeChild(elementDelete);
});

// Lấy ra danh sách tin nhắn
if(bodyChat) {
  const chatsRef = ref(db, 'chats');
  onChildAdded(chatsRef, (dataChat) => {
    const key = dataChat.key;
    const userId = dataChat.val().userId;
    const content = dataChat.val().content;
    const images = dataChat.val().images;

    get(child(dbRef, `users/${userId}`)).then((snapshot) => {
      if (snapshot.exists()) {
        const fullName = snapshot.val().fullName;

        const elementChat = document.createElement("div");
        elementChat.setAttribute("chat-key", key);

        let stringFullName = "";
        let stringButtonDelete = "";
        let stringImages = "";
        let stringContent = "";

        if(images) {
          stringImages += `
            <div class="inner-images">
          `;

          for (const image of images) {
            stringImages += `
              <img src="${image}" />
            `;
          }

          stringImages += `
            </div>
          `;
        }

        if(content) {
          stringContent = `
            <div class="inner-content">
              ${content}
            </div>
          `;
        }
        
        if(userId == auth.currentUser.uid) {
          elementChat.classList.add("inner-outgoing");
          stringButtonDelete = `
            <button class="button-delete" button-delete="${key}">
              <i class="fa-regular fa-trash-can"></i>
            </button>
          `;
        } else {
          elementChat.classList.add("inner-incoming");
          stringFullName = `
            <div class="inner-name">
              ${fullName}
            </div>
          `;
        }

        elementChat.innerHTML = `
          ${stringFullName}
          ${stringContent}
          ${stringImages}
          ${stringButtonDelete}
        `;

        bodyChat.appendChild(elementChat);

        new Viewer(elementChat);

        if(userId == auth.currentUser.uid) {
          buttonDeleteChat(key);
        }
      } else {
        console.log("No data available");
      }
    }).catch((error) => {
      console.error(error);
    });
  });
}

// Chèn icon
const emojiPicker = document.querySelector('emoji-picker');
if(emojiPicker) {
  const inputChat = document.querySelector(".chat .inner-form input[name='content']");

  emojiPicker.addEventListener('emoji-click', event => {
    const icon = event.detail.unicode;
    inputChat.value += icon;
  });
}

// Hiển thị tooltip
const buttonIcon = document.querySelector(".button-icon");
if(buttonIcon) {
  const tooltip = document.querySelector('.tooltip');
  Popper.createPopper(buttonIcon, tooltip);

  buttonIcon.addEventListener("click", () => {
    tooltip.classList.toggle('shown');
  })
}
// Hết Hiển thị tooltip