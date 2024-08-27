import React from 'react';
import styles from './SortOptions.module.css'

const SortOptions = ({ sortBy, onSortChange }) => {
  return (
    <div onChange={onSortChange} value={sortBy}>
      <button value="createdAt" className={styles.sortBtn}>Latest</button>
      <button value="reactions" className={styles.sortBtn}>Popularity</button>
    </div>
  );
};

export default SortOptions;
