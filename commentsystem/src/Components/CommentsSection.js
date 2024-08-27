// CommentsSection.js
import React, { useState } from 'react';
import CommentsInput from './CommentInput';
import CommentsList from './CommentList';

const CommentsSection = ({ sortBy }) => {
  const [refresh, setRefresh] = useState(false);

  const handleCommentAdded = () => {
    setRefresh(!refresh); // Toggle refresh to re-fetch comments
  };

  return (
    <div>
      <CommentsInput onCommentAdded={handleCommentAdded} />
      <CommentsList key={refresh} sortBy={sortBy} />
    </div>
  );
};

export default CommentsSection;
