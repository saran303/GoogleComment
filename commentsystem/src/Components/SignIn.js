// /components/SignIn.js
import React from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebase';
import { FaGoogle } from 'react-icons/fa';
import styles from './Signin.module.css'

const SignIn = () => {
  const signInWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
      .then((result) => {
        console.log("User signed in: ", result.user);
      })
      .catch((error) => {
        console.error("Error during sign-in: ", error);
      });
  };

  return (
    <div>
      <button onClick={signInWithGoogle} style={{ border: "0px", cursor: "pointer" }}>
        <div className={styles.googleWrapper}>
          <FaGoogle size={24} />
          Sign in with Google
        </div>
      </button>
    </div>
  );
};

export default SignIn;
