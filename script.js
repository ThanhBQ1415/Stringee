





import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-analytics.js"; 
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js"; 
import { get } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAuZKqdyC8UuoQDr-8pe0PINo6vuRsJjQk",
  authDomain: "ltm5-3afba.firebaseapp.com",
  databaseURL: "https://ltm5-3afba-default-rtdb.firebaseio.com",
  projectId: "ltm5-3afba",
  storageBucket: "ltm5-3afba.firebasestorage.app",
  messagingSenderId: "797421000508",
  appId: "1:797421000508:web:7afecc6f06f3d519fc3039",
  measurementId: "G-2EJPLL7MTX"
};
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const videoContainer = document.querySelector("#videos");















const PROJECT_ID = "SK.0.voZxMHRDblsAoh7dku3fbUxdkm8rC1qI";
const PROJECT_SECRET = "bzNvTVBGTlAydWdxd3Z3OHhpUnR5OHI5WkdxMjRTRkY=";
const BASE_URL = "https://api.stringee.com/v1/room2";


class API {
  constructor(projectId, projectSecret) {
    this.projectId = projectId;
    this.projectSecret = projectSecret;
    this.restToken = "";
  }

  async createRoom() {
    const roomName = Math.random().toFixed(4);

    const response = await axios.post(
      `${BASE_URL}/create`,
      {
        name: roomName,
        uniqueName: roomName
      },
      {
        headers: this._authHeader()
      }
    );

    const room = response.data;
    console.log({ room });
    return room;
  }z

  async listRoom() {
    const response = await axios.get(`${BASE_URL}/list`, {
      headers: this._authHeader()
    });

    const rooms = response.data.list;
    console.log({ rooms });
    return rooms;
  }
  
  async deleteRoom(roomId) {
    const response = await axios.put(`${BASE_URL}/delete`, {
      roomId
    }, {
      headers: this._authHeader()
    })
    
    console.log({response})
    
    return response.data;
  }
  
  async clearAllRooms() {
    const rooms = await this.listRoom()
    const response = await Promise.all(rooms.map(room => this.deleteRoom(room.roomId)))
    
    return response;
  }

  async setRestToken() {
    const tokens = await this._getToken({ rest: true });
    const restToken = tokens.rest_access_token;
    this.restToken = restToken;

    return restToken;
  }

  async getUserToken(userId) {
    const tokens = await this._getToken({ userId });
    return tokens.access_token;
  }

  async getRoomToken(roomId) {
    const tokens = await this._getToken({ roomId });
    return tokens.room_token;
  }

  async _getToken({ userId, roomId, rest }) {
    const response = await axios.get(
      "https://v2.stringee.com/web-sdk-conference-samples/php/token_helper.php",
      {
        params: {
          keySid: this.projectId,
          keySecret: this.projectSecret,
          userId,
          roomId,
          rest
        }
      }
    );

    const tokens = response.data;
    console.log({ tokens });
    return tokens;
  }

  isSafari() {
    const ua = navigator.userAgent.toLowerCase();
    return !ua.includes('chrome') && ua.includes('safari');
  }

  _authHeader() {
    return {
      "X-STRINGEE-AUTH": this.restToken
    };
  }
}

const api = new API(PROJECT_ID, PROJECT_SECRET);





















async function saveRoomMappingToFirebase(inputRoomId, apiRoomId) {
  const roomRef = ref(database, `rooms/${inputRoomId}`);
  await set(roomRef, { apiRoomId: apiRoomId });
  console.log(`Đã lưu ${inputRoomId} với giá trị ${apiRoomId} vào Firebase`);
}

async function getRoomMapping(inputRoomId) {
  const roomMappingRef = ref(database, 'rooms/' + inputRoomId);
  const snapshot = await get(roomMappingRef);

  if (snapshot.exists()) {
      return snapshot.val(); 
  } else {
      console.log("No data available for this inputRoomId.");
      return null; 
  }
}


const vm = new Vue({
  el: "#app",
  data: {
    userToken: "",
    roomId: "",
    roomToken: "",
    room: undefined,
    callClient: undefined,
    displayRoomId: "" ,
  },
    computed: {
      roomUrl: function() {
                // return `http://${location.hostname}:8081?room=${  this.displayRoomId}`
            return `https://stringee.vercel.app/?room=${  this.displayRoomId}`
      }
    },

  async mounted() {
    api.setRestToken();

    const urlParams = new URLSearchParams(location.search);
    const roomId = urlParams.get("room");
    const roomMapping = await getRoomMapping(roomId);
    if (roomMapping) {
      this.roomId = roomMapping.apiRoomId;

      await this.join();
    }
  },
  // async mounted() {
  //   api.setRestToken();

  //   const urlParams = new URLSearchParams(location.search);
  //   const roomId = urlParams.get("room");

  //   if (roomId) {
  //     this.roomId = roomId;

  //     await this.join();
  //   }
  // },

  methods: {
    authen: function() {
      return new Promise(async resolve => {
        const userId = `${(Math.random() * 100000).toFixed(6)}`;
        const userToken = await api.getUserToken(userId, `https://stringee.vercel.app/?room=${this.displayRoomId}`);
        this.userToken = userToken;

        if (!this.callClient) {
          const client = new StringeeClient();

          client.on("authen", function(res) {
            console.log("on authen: ", res);
            resolve(res);
          });
          this.callClient = client;
        }
        this.callClient.connect(userToken);
      });
    },
    publish: async function(screenSharing = false) {
      const localTrack = await StringeeVideo.createLocalVideoTrack(
        this.callClient,
        {
          audio: true,
          video: true,
          screen: screenSharing,
          videoDimensions: { width: 640, height: 360 }
        }
      );

      const videoElement = localTrack.attach();
      this.addVideo(videoElement);

      const roomData = await StringeeVideo.joinRoom(
        this.callClient,
        this.roomToken
      );
      const room = roomData.room;
      console.log({ roomData, room });

      if (!this.room) {
        this.room = room;
        room.clearAllOnMethos();
        room.on("addtrack", e => {
          const track = e.info.track;

          console.log("addtrack", track);
          if (track.serverId === localTrack.serverId) {
            console.log("local");
            return;
          }
          this.subscribe(track);
        });
        room.on("removetrack", e => {
          const track = e.track;
          if (!track) {
            return;
          }

          const mediaElements = track.detach();
          mediaElements.forEach(element => element.remove());
        });

        // Join existing tracks
        roomData.listTracksInfo.forEach(info => this.subscribe(info));
      }

      await room.publish(localTrack);
      console.log("room publish successful");
    },





    async createRoom() {
  
      const inputRoomId = prompt("Nhập ID phòng mà bạn muốn hiển thị:");
      const room = await api.createRoom();
      const { roomId: apiRoomId } = room;
      const roomToken = await api.getRoomToken(apiRoomId);

      this.roomId = apiRoomId;
      this.roomToken = roomToken;
      this.displayRoomId=inputRoomId;
      await saveRoomMappingToFirebase(inputRoomId, apiRoomId);
      console.log(`${inputRoomId} => ${apiRoomId}`);

      await this.authen();
      await this.publish();
    },










    join: async function() {
      const roomToken = await api.getRoomToken(this.roomId);
      this.roomToken = roomToken;

      await this.authen();
      await this.publish();
    },


    async joinWithId() {
      const inputRoomId = prompt("Dán Room ID vào đây nhé!");
      if (inputRoomId) {
          // Lấy apiRoomId từ Firebase
          const roomMapping = await getRoomMapping(inputRoomId);
          
          if (roomMapping) {
              console.log(`Đã tìm thấy: inputRoomId: ${inputRoomId}, apiRoomId: ${roomMapping.apiRoomId}`);
              this.roomId = roomMapping.apiRoomId; 
              
              const roomToken = await api.getRoomToken(this.roomId);
              this.roomToken = roomToken;
  
              await this.authen();
              await this.publish();
          } else {
              console.log("Không tìm thấy apiRoomId cho inputRoomId này.");
          }
      }
  },

   

    subscribe: async function(trackInfo) {
      const track = await this.room.subscribe(trackInfo.serverId);
      track.on("ready", () => {
        const videoElement = track.attach();
        this.addVideo(videoElement);
      });
    },
    addVideo: function(video) {
      video.setAttribute("controls", "true");
      video.setAttribute("playsinline", "true");
      videoContainer.appendChild(video);
    }
  }
  
});
z

