import { useState, useEffect } from "react"
import { useAuth } from "../services/authProvider.jsx"
import { getFriends, getUserInfo, getFriendsPending, getFriendsToRespond, cancelFriendship, acceptFriendship, newFriendship } from "../services/authService.js"
import { ProfilePicture, IconText, IconsOverlayFrame } from "./iconUtils.jsx"
import { AlertMessage, OptionAlert } from "../services/alertMessage"
import { Sixtyfour, P, H2, H3, LI, UL } from "./typography"

 function Button({text, onClick, src}){
    return(
        <button className="group relative flex items-center " onClick={onClick}>
            <img src={src} alt="chopstick button icon" className="w-4 h-auto" />
            <div className="absolute z-20 left-2/3 top-1/2 transform -translate-y-1/2 ml-2">
                <IconText text={text} />
            </div>
        </button>
    )
}

function Card({ friends, buttonText, onDelete, onAccept, children }) {

  return (
    <div className="rounded-2xl p-6 text-center border rounded-xl border-greyish overflow-y-auto overflow-x-hidden">
    
    <div className="flex items-center justify-center relative">
      <Sixtyfour>{children}</Sixtyfour>
      {(children === "Friends list") && ( <Button
              className="absolute right-0"
              text="Add friend"
              onClick={() => onAccept(21)}
              src="/validation_icons/+_bold_cut_yellow.svg"
             /> )} 
    </div>

      {friends && friends.map((friendship) => {
        return (
          <div key={friendship.id} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              {(children === "Friends list") && (<span
                className={`w-2 h-2 rounded-full ${
                friendship.online_status ? 'bg-green-700' : 'bg-red-600'
               }`}
              ></span>)}
              <ProfilePicture
                src={friendship.avatar}
                className="w-8 h-8"
              />
              <P className="">{friendship.username}</P>
            </div>
           {(children === "Request confirmation") && ( <Button
              text="Accept invitation"
              onClick={() => onAccept(friendship.id)}
              src="/validation_icons/V_bold_cut.svg"
             />)} 
            
            <Button
              text={buttonText}
              onClick={() => onDelete(friendship.id)}
              src="/validation_icons/X_bold_cut.svg"
            />
        </div>
        )
      })}
    </div>
  );
}

export function Friends({setScreen}) {
  const { userId } = useAuth()

  const [friends, setFriends] = useState([])
  const [pending, setPending] = useState([])
  const [requests, setRequests] = useState([])

  useEffect(() => {
    if (!userId) return;

    async function fetchFriendships(fetchFct, setState) {
      try {
        const data = await fetchFct(userId)
        const friendsInfo = await Promise.all(data.map(async (friendship) => {
          const friendId = (friendship.user1_id === userId) ?  friendship.user2_id : friendship.user1_id
          return await getUserInfo(friendId)
        }))
        setState(friendsInfo)
      } catch (error) {
        console.error(error);
      }
    }

    fetchFriendships(getFriends, setFriends)
    fetchFriendships(getFriendsPending, setPending)
    fetchFriendships(getFriendsToRespond, setRequests)
  }, [userId])

  async function deleteFriendship(friendId) {
    try {
      const result = await OptionAlert.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, delete it!"
      })
      
      if (!result.isConfirmed) return
    
      await cancelFriendship(userId, friendId)
     
      setFriends(prev => prev.filter(friend => friend.id !== friendId))
      setPending(prev => prev.filter(friend => friend.id !== friendId))
      setRequests(prev => prev.filter(friend => friend.id !== friendId))   
      
      await AlertMessage.fire({
      title: "Deleted!",
      text: "Friendship removed successfully.",
      icon: "success"
    })
      
    } catch (error) {
      AlertMessage.fire({
        icon: "error",
        text: error.message,
      })
    }
  }

  async function acceptFriend(friendId) {
    try {
      const data = await acceptFriendship(userId, friendId)
      const acceptedUser = requests.find(friend => friend.id === friendId)
      if (acceptedUser) setFriends(prev => [...prev, acceptedUser])
      setRequests(prev => prev.filter(friend => friend.id !== friendId))
      
      AlertMessage.fire({
        icon: "success",
        text: "You have a new friend!",
      })
    } catch (error) {
      AlertMessage.fire({
        icon: "error",
        text: error.message,
      })
    }
  }

  async function newFriend(friendId) {
    try {
      const data = await newFriendship(userId, friendId)

      setFriends(prev => prev.filter(friend => friend.id !== friendId))
      setPending(prev => prev.filter(friend => friend.id !== friendId))
      setRequests(prev => prev.filter(friend => friend.id !== friendId))   

      AlertMessage.fire({
        icon: "success",
        text: "You send a new friend request!",
      })
    } catch (error) {
      AlertMessage.fire({
        icon: "error",
        text: error.message,
      })
    }
  }

  return (
    <div className="flex flex-col relative w-full h-full justify-center items-center min-h-0 ">
      <div className="absolute inset-0">
          <IconsOverlayFrame />
      </div>
      <div className="relative grid grid-cols-1 md:grid-cols-2 gap-6 w-full h-full max-w-5xl px-4 py-4">
        <div className="flex flex-col justify-evenly h-full">
          <Card friends={ requests } buttonText="Decline invitation" onDelete={deleteFriendship} onAccept={acceptFriend}>Request confirmation</Card>
          <Card friends={ pending } buttonText="Cancel invitation" onDelete={deleteFriendship}>Pending</Card>
        </div>
        <div className="h-full min-h-0 overflow-y-auto overflow-x-hidden">
          <Card friends={ friends } buttonText="Delete friendship" onDelete={deleteFriendship} onAccept={newFriend}>Friends list</Card>
        </div>
      </div>
    </div>
  )
}