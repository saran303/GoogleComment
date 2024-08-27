import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, limit, startAfter, getDocs, updateDoc, doc, Timestamp, arrayUnion } from 'firebase/firestore';
import { firestore, auth } from '../firebase';
import EmojiPicker from 'emoji-picker-react';
import DOMPurify from 'dompurify';
import CommentsInput from './ReplyCommentInput';
import { useAuthState } from 'react-firebase-hooks/auth';
import './CommentsList.css'; // Import the CSS file

const CommentsList = ({ sortBy }) => {
  const [user] = useAuthState(auth);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastVisible, setLastVisible] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);
  const [replyToCommentId, setReplyToCommentId] = useState(null);

  const fetchComments = useCallback(async (nextPage = false) => {
    setLoading(true);
    try {
      const commentsRef = collection(firestore, 'comments');
      // const q = query(
      //   commentsRef,
      //   orderBy(sortBy, 'desc'),
      //   limit(8),
      //   ...(nextPage && lastVisible ? [startAfter(lastVisible)] : [])
      // );

      const querySnapshot = await getDocs(commentsRef);
      const commentsList = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
        };
      });

      setComments(prev => nextPage ? [...prev, ...commentsList] : commentsList);
      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
    } catch (error) {
      console.error("Error fetching comments: ", error);
    } finally {
      setLoading(false);
    }
  }, [lastVisible, sortBy]);

  useEffect(() => {
    fetchComments();
  }, [sortBy, fetchComments]);

  const handleEmojiClick = async (emojiData, commentId) => {
    const emoji = emojiData.emoji;
    const commentDocRef = doc(firestore, 'comments', commentId);

    const updatedReactions = {
      ...comments.find(comment => comment.id === commentId).reactions,
      [emoji]: (comments.find(comment => comment.id === commentId).reactions?.[emoji] || 0) + 1
    };

    await updateDoc(commentDocRef, { reactions: updatedReactions });
    fetchComments(); // Fetch updated comments after reaction
    setShowEmojiPicker(null); // Close the emoji picker after selecting an emoji
  };

  const toggleEmojiPicker = (commentId) => {
    setShowEmojiPicker(showEmojiPicker === commentId ? null : commentId);
  };

  const handleReplySubmit = async (replyText) => {
    if (!replyText.trim() || !replyToCommentId) return;

    const commentDocRef = doc(firestore, 'comments', replyToCommentId);

    // const newReply = {
    //   text: replyText,
    //   createdAt: Timestamp.now(),
    //   userName: "Current User Name", // Replace with actual current user name
    //   userPhoto: "Current User Photo URL", // Replace with actual current user photo URL
    //   reactions: {},
    //   replies: [] // Initialize as empty array for further nested replies
    // };
    const reply = {
      text: replyText,
      userName: user.displayName,
      userPhoto: user.photoURL,
      createdAt: Timestamp.now(),
  };

    await updateDoc(commentDocRef, {
      replies: arrayUnion(reply)
    });

    setReplyToCommentId(null);
    fetchComments(); // Refresh comments after adding reply
  };

  const handleReplyCancel = () => {
    setReplyToCommentId(null);
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInMs = now - date;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else {
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
      } else {
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
      }
    }
  };

  const renderReplies = (replies, depth = 1) => (
    <div className="comment-replies" style={{ marginLeft: `${depth * 50}px` }}>
      {replies.map((reply, index) => (
        
        <div key={index} className="comment-reply">
          <div className="comment-header">
            <img src={reply.userPhoto} alt={reply.userName} className="comment-avatar" />
            <p><strong>{reply.userName}</strong></p>
          </div>
          <p
            className="comment-text"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(reply.text) }}
          />
          {reply.fileURL && <img src={reply.fileURL} alt="attachment" className="comment-image" />}
          {/* <p className="comment-time">{formatTimeAgo(reply.createdAt)}</p> */}
          <div className="comment-actions">
            <div>
              <img
                src="https://s3-alpha-sig.figma.com/img/193f/2659/baf5e670d0c5e86a6b43e6cb59435d12?Expires=1725840000&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=gpIrDw414Irx3vwGkolkuCjPE9aXlEkaw9u-3NS7nU08X8-ZyR8sLwLxdtZoRpEBMCQDdB3dJUVwzt07UQoSK1l7xnNVBsRVII-N38mLUJ0RCms~~dKsvGVOrIoFtrDLxkj98SBr~FhVV83EjxOVgEfxHH7nsGLXmOotzXFYxJSSNQlhXL4AXusDeD7CFfsUGVfwwu~A2c-fi2ZUD~omI4wHTmXT7VkAsQm1czD-XcTfLDt6GYDSQeONmzOj5PZ~BGOLC2X9ODLAUTD66K1qDkFnn-ceUXaVSwroUwwuMYRL2QHCVyON~eI8sBNOxlALvuw27hoy7IcK17Y4F~Dnvg__"
                alt="emoji"
                onClick={() => toggleEmojiPicker(reply.id)}
                className="comment-action-icon"
              />
            </div>
            <div>
              {reply.reactions && Object.entries(reply.reactions).map(([emoji, count]) => (
                <span key={emoji} className="comment-reaction">
                  {emoji} {count}
                </span>
              ))}
            </div>
            {showEmojiPicker === reply.id && (
              <EmojiPicker onEmojiClick={(emojiData) => handleEmojiClick(emojiData, reply.id)} />
            )}
            <div>
            <p
            onClick={() => setReplyToCommentId(reply.id)}
            style={{ cursor: 'pointer' }}>Reply</p>
            </div>
            <div>
            <p className="comment-time">{formatTimeAgo(reply.createdAt)}</p>
            </div>
          </div>
          {replyToCommentId === reply.id && (
            <CommentsInput
              commentId = {reply.id}
            />
          )}
          
          {/* Recursively render nested replies */}
          {reply.replies && reply.replies.length > 0 && renderReplies(reply.replies, depth + 1)}
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ marginTop: '20px' }}>
      {comments.map(comment => (
        <div key={comment.id} className="comment-container">
          <div className="comment-header">
            <img src={comment.userPhoto} alt={comment.userName} className="comment-avatar" />
            <p><strong>{comment.userName}</strong></p>
          </div>
          <p
            className="comment-text"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(comment.text) }}
          />
          {comment.fileURL && <img src={comment.fileURL} alt="attachment" className="comment-image" />}
          <div className="comment-actions">
            <div>
              <img
                src="https://s3-alpha-sig.figma.com/img/193f/2659/baf5e670d0c5e86a6b43e6cb59435d12?Expires=1725840000&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=gpIrDw414Irx3vwGkolkuCjPE9aXlEkaw9u-3NS7nU08X8-ZyR8sLwLxdtZoRpEBMCQDdB3dJUVwzt07UQoSK1l7xnNVBsRVII-N38mLUJ0RCms~~dKsvGVOrIoFtrDLxkj98SBr~FhVV83EjxOVgEfxHH7nsGLXmOotzXFYxJSSNQlhXL4AXusDeD7CFfsUGVfwwu~A2c-fi2ZUD~omI4wHTmXT7VkAsQm1czD-XcTfLDt6GYDSQeONmzOj5PZ~BGOLC2X9ODLAUTD66K1qDkFnn-ceUXaVSwroUwwuMYRL2QHCVyON~eI8sBNOxlALvuw27hoy7IcK17Y4F~Dnvg__"
                alt="emoji"
                onClick={() => toggleEmojiPicker(comment.id)}
                className="comment-action-icon"
              />
            </div>
            <div>
              {comment.reactions && Object.entries(comment.reactions).map(([emoji, count]) => (
                <span key={emoji} className="comment-reaction">
                  {emoji} {count}
                </span>
              ))}
            </div>
            {showEmojiPicker === comment.id && (
              <EmojiPicker onEmojiClick={(emojiData) => handleEmojiClick(emojiData, comment.id)} />
            )}
            <div>
            <p
            onClick={() => setReplyToCommentId(comment.id)}
            style={{ cursor: 'pointer' }}>Reply</p>
            </div>
            <div>
            <p className="comment-time">{formatTimeAgo(comment.createdAt)}</p>
            </div>
          </div>
          {replyToCommentId === comment.id && (
            <CommentsInput
              commentId = {comment.id}
            />
          )}
          {comment.replies && comment.replies.length > 0 && renderReplies(comment.replies)}
        </div>
      ))}
      {loading && <p>Loading...</p>}
      {!loading && lastVisible && (
        <button onClick={() => fetchComments(true)}>Load More Comments</button>
      )}
    </div>
  );
};

export default CommentsList;
