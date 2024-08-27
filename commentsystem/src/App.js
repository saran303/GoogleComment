import './App.css'
import React, { useEffect, useState } from 'react';
import { auth } from './firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import SignIn from './Components/SignIn';
import SortOptions from './Components/SortOptions';
import CommentsSection from './Components/CommentsSection';
import { collection, getDocs } from "firebase/firestore";
import { firestore } from "./firebase";

function App() {
  const [user] = useAuthState(auth);
  const [sortBy, setSortBy] = useState('createdAt');
  const [commentsCount, setCommentsCount] = useState(0);

  useEffect(() => {
    const fetchCommentsCount = async () => {
      try {
        const querySnapshot = await getDocs(collection(firestore, "comments"));
        setCommentsCount(querySnapshot.size);
      } catch (error) {
        console.error("Error fetching comments: ", error);
      }
    };

    fetchCommentsCount();
  }, []);
  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };
  return (
    <div className="App">
      {user ? (
        <div className='userWrapper'>
          <div className='userInfoWrapper'>
            <img src={user.photoURL} alt={user.displayName} style={{ width: '50px', borderRadius: '50%' }} />
            <p>{user.displayName}</p>
          </div>
          <div>
            <button className='logoutBtn'>Logout</button>
          </div>
        </div>
      ) : (
        <div className='signInWrapper'>
          <SignIn />
        </div>
      )}
      <div className='CommentsSortWrapper'>
      <h1>Comments({commentsCount})</h1>
      <SortOptions sortBy={sortBy} onSortChange={handleSortChange} />
      </div>
        <CommentsSection />
    </div>
  );
}

export default App;
