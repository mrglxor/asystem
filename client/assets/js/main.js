let APP_ID;
let uid = sessionStorage.getItem('uid')
if(!uid){
    uid = String(Math.floor(Math.random() * 10000))
    sessionStorage.setItem('uid', uid)
}

let token = null;


let rtmClient;
let channel;

let roomId = 'home'
rooms__count
let membersHereBeforeMe = [];
let currentRoomData = {}

let joinRoomInit = async () => {
    let response = await fetch(`https://mumble2.herokuapp.com/get_rtm_token?uid=${uid}`)
    let data = await response.json()
    token = await data.token
    APP_ID = await data.APP_ID

    rtmClient = await AgoraRTM.createInstance(APP_ID)
    await rtmClient.login({uid,token})
    
    channel = await rtmClient.createChannel(roomId)
    await channel.join()

    membersHereBeforeMe = await channel.getMembers()
    membersHereBeforeMe = membersHereBeforeMe.filter((value) => {
        return value !== uid; });

    await checkHeartBeat()

    channel.on('MemberLeft', async (MemberId) => {
        console.log('Member has left the channel......')

        membersHereBeforeMe = membersHereBeforeMe.filter(function(item) {
            return item !== MemberId
        })
    })

    channel.on('MemberJoined', (MemberId) => {
        console.log('Member joined..')
        rtmClient.sendMessageToPeer({text:JSON.stringify({'type':'rooms_update', 'roomsData':currentRoomData})}, MemberId)
    })

    channel.on('ChannelMessage', async (messageData, MemberId) => {
        let data = JSON.parse(messageData.text)
        await buildRooms(data.roomsData)

    })

    rtmClient.on('MessageFromPeer', async (messageData, MemberId) => {
        let data = JSON.parse(messageData.text)
        await buildRooms(data.roomsData)
    })

    let interval = setInterval(() => {
        checkHeartBeat()
    }, 5000)
    return () => clearInterval(interval)
}

let leaveChannel = async () => {
    await channel.leave()
    await rtmClient.logout()
}

window.addEventListener("beforeunload", leaveChannel)

let checkHeartBeat = async () => {
    if(membersHereBeforeMe.length === 0){
        console.log('We are the senior member')
        await getRoomsData()
    }
}


let getRoomsData = async () => {
    let {rooms} = await rtmClient.getChannelAttributesByKeys('home', ['rooms'])
        if(!rooms){ rooms = []}else{rooms = JSON.parse(rooms.value)}

        let newRoomsList = []
        let roomsData = {}
        for (let i = 0; rooms.length > i; i ++){
            let roomName = rooms[i]
            let memberCount = await rtmClient.getChannelMemberCount([roomName])
            let {room_name, host} = await rtmClient.getChannelAttributesByKeys(roomName, ['room_name', 'host'])
            console.log('Host:', host)
            memberCount = memberCount[roomName]
            roomsData[roomName] = {'memberCount':memberCount, 'room_name':room_name, 'host':host}

            if(memberCount > 0){
                newRoomsList.push(roomName)
            }
        }
        await rtmClient.addOrUpdateChannelAttributes(roomId, {'rooms':JSON.stringify(newRoomsList)})

        channel.sendMessage({text:JSON.stringify({'type':'rooms_update', 'roomsData':roomsData})})

        await buildRooms(roomsData)
}

let buildRooms = async (roomsData) => {
    console.log('Build rooms called..')
    let count = Object.keys(roomsData).length
    document.getElementById('rooms__count').innerText = count

    currentRoomData = roomsData
    let roomsContainer = document.getElementsByClassName('room__container')[0]
    for(key in roomsData){
        let exits = document.getElementById(`room-${key}`)
        if(exits){
            exits.remove()
        }
  
        let room =  `<div id="room-${key}" class="room__item">
                        <div class="room__content">
                            <p class="room__meta">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M10.118 16.064c2.293-.529 4.428-.993 3.394-2.945-3.146-5.942-.834-9.119 2.488-9.119 3.388 0 5.644 3.299 2.488 9.119-1.065 1.964 1.149 2.427 3.394 2.945 1.986.459 2.118 1.43 2.118 3.111l-.003.825h-15.994c0-2.196-.176-3.407 2.115-3.936zm-10.116 3.936h6.001c-.028-6.542 2.995-3.697 2.995-8.901 0-2.009-1.311-3.099-2.998-3.099-2.492 0-4.226 2.383-1.866 6.839.775 1.464-.825 1.812-2.545 2.209-1.49.344-1.589 1.072-1.589 2.333l.002.619z"/></svg>
                                <span>${roomsData[key]['memberCount']} Participants</span>
                            </p>
                            <h4 class="room__title">${roomsData[key]['room_name'].value}</h4>
                            <div class="room__box">
                                <div class="room__author">
                                    <strong class="message__author">${roomsData[key]['host'].value}</strong>
                                </div>
                                <a class="room__action" target="_blank" href="lobby.html?room=${key}">Join Now</a>
                            </div>
                        </div>
                    </div>`

        
        
        `<div id="room-${key}">
                        <h4><a href="lobby.html?room=${key}">${roomsData[key]['room_name'].value}</a></h4>
                        <p>${roomsData[key]['memberCount']}</p>
                        p>${roomsData[key]['host'].value}</p>
                    </div>`
        if(roomsData[key]['memberCount'] > 0){
            roomsContainer.insertAdjacentHTML('afterbegin', room)
        }
       
    }
}

joinRoomInit()