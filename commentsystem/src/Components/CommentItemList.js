import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, limit, startAfter, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { firestore } from '../firebase';
import EmojiPicker from 'emoji-picker-react';
import DOMPurify from 'dompurify'; // Import DOMPurify

const CommentsList = ({ sortBy }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastVisible, setLastVisible] = useState(null);
  const [selectedCommentId, setSelectedCommentId] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);

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

      setComments((prev) => nextPage ? [...prev, ...commentsList] : commentsList);
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

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInMs = now - date;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} `;
    } else {
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} `;
      } else {
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} `;
      }
    }
  };

  return (
    <div style={{ marginTop: '20px' }}>
      {comments.map(comment => (
        <div key={comment.id} style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', textAlign: 'center' }}>
            <img src={comment.userPhoto} alt={comment.userName} style={{ width: '40px', borderRadius: '50%' }} />
            <p><strong>{comment.userName}</strong></p>
          </div>
          <p
            style={{ fontWeight: comment.fontWeight, fontStyle: comment.italic ? 'italic' : 'normal' }}
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(comment.text) }} // Sanitize and render HTML
          />
          {comment.fileURL && <img src={comment.fileURL} alt="attachment" style={{ maxWidth: '100%' }} />}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', textAlign: 'center' }}>
            <div>
              <img
                src="https://s3-alpha-sig.figma.com/img/193f/2659/baf5e670d0c5e86a6b43e6cb59435d12?Expires=1725840000&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=gpIrDw414Irx3vwGkolkuCjPE9aXlEkaw9u-3NS7nU08X8-ZyR8sLwLxdtZoRpEBMCQDdB3dJUVwzt07UQoSK1l7xnNVBsRVII-N38mLUJ0RCms~~dKsvGVOrIoFtrDLxkj98SBr~FhVV83EjxOVgEfxHH7nsGLXmOotzXFYxJSSNQlhXL4AXusDeD7CFfsUGVfwwu~A2c-fi2ZUD~omI4wHTmXT7VkAsQm1czD-XcTfLDt6GYDSQeONmzOj5PZ~BGOLC2X9ODLAUTD66K1qDkFnn-ceUXaVSwroUwwuMYRL2QHCVyON~eI8sBNOxlALvuw27hoy7IcK17Y4F~Dnvg__"
                alt="emoji"
                onClick={() => toggleEmojiPicker(comment.id)}
                style={{ cursor: 'pointer', width: '18px', marginLeft: '10px' }}
              />
            </div>
            <div>
              {comment.reactions && Object.entries(comment.reactions).map(([emoji, count]) => (
                <span key={emoji} style={{ marginRight: '10px' }}>
                  {emoji} {count}
                </span>
              ))}
            </div>
            {showEmojiPicker === comment.id && (
              <EmojiPicker onEmojiClick={(emojiData) => handleEmojiClick(emojiData, comment.id)} />
            )}
            <img
              src='https://s3-alpha-sig.figma.com/img/c4d7/2aa7/7849c5307905734cbc598f76d292f375?Expires=1725840000&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=D2BQmUhGlP6meIKkXP4v84n1MmoTqfpe7fX4fbZmH6RTUxtZW3earPlcNz5kQaNH~RzfOwAg8uDE7aPbn-F55SgchypCpnJk2qyE3Yazm8LnZCS~RwLK~cuuV1211ewpy18-G3R6Lk4IJXOjfD55hEcuhpTl4~PuHp6LcyGuWxCsyS8cG9WuzkGNAg1ngSDDvNhicecJipyNtINZVPaan7x8h8MAJeynSHogrcxyv1IsB0uT7WUFfpypk3mQ-wUEdxezM1ektCS8cXPvURe7LU087uKlHM7DI6NofNURgPzrUmhtVFQKInjS6pyi7bY3U5CSdE0dsQ3KuffpxVylxg__'
              alt='bar'
              style={{ cursor: 'pointer', width: '2px' }}
            />
            <p>Reply</p>
            <img
              src='https://s3-alpha-sig.figma.com/img/c4d7/2aa7/7849c5307905734cbc598f76d292f375?Expires=1725840000&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=D2BQmUhGlP6meIKkXP4v84n1MmoTqfpe7fX4fbZmH6RTUxtZW3earPlcNz5kQaNH~RzfOwAg8uDE7aPbn-F55SgchypCpnJk2qyE3Yazm8LnZCS~RwLK~cuuV1211ewpy18-G3R6Lk4IJXOjfD55hEcuhpTl4~PuHp6LcyGuWxCsyS8cG9WuzkGNAg1ngSDDvNhicecJipyNtINZVPaan7x8h8MAJeynSHogrcxyv1IsB0uT7WUFfpypk3mQ-wUEdxezM1ektCS8cXPvURe7LU087uKlHM7DI6NofNURgPzrUmhtVFQKInjS6pyi7bY3U5CSdE0dsQ3KuffpxVylxg__'
              alt='bar'
              style={{ cursor: 'pointer', width: '2px' }}
            />
            <p>{formatTimeAgo(comment.createdAt)}</p>
          </div>
        </div>
      ))}
      <button onClick={() => fetchComments(true)} disabled={loading}>
        {loading ? "Loading..." : "Load More"}
      </button>
    </div>
  );
};

export default CommentsList;
