import React, { useState, useRef } from 'react';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import FormControl from '@mui/joy/FormControl';
import IconButton from '@mui/joy/IconButton';
import FormatBold from '@mui/icons-material/FormatBold';
import FormatItalic from '@mui/icons-material/FormatItalic';
import FormatUnderlined from '@mui/icons-material/FormatUnderlined';
import AttachFile from '@mui/icons-material/AttachFile';
import { collection, addDoc, getDocs, query, Timestamp, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { firestore, auth, storage } from '../firebase'; 
import { useAuthState } from 'react-firebase-hooks/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const CommentsInput = ({ onCommentAdded }) => {
    const [user] = useAuthState(auth);
    const [mentionList, setMentionList] = useState([]);
    const [file, setFile] = useState(null);
    const [editorContent, setEditorContent] = useState("");
    const editorRef = useRef(null);

    const handleFormat = (command) => {
        document.execCommand(command, false, null);
    };

    const handleKeyUp = async (e) => {
        if (e.key === '@') {
            const usersQuery = query(collection(firestore, "users"));
            const usersSnapshot = await getDocs(usersQuery);
            const usersList = usersSnapshot.docs.map(doc => doc.data());
            setMentionList(usersList);
        }
    };

    const handleMentionClick = (userName) => {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(`@${userName}`));
        setMentionList([]);
    };

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };
    // console.log(user.displayName)

    const handleSend = async () => {
        if (editorContent.trim() || file) {
            let fileURL = "";
            if (file) {
                const fileRef = ref(storage, `attachments/${file.name}`);
                await uploadBytes(fileRef, file);
                fileURL = await getDownloadURL(fileRef);
            }

            try {
                const newComment = {
                    text: editorContent,
                    createdAt: Timestamp.now(),
                    userName: user.displayName,
                    userPhoto: user.photoURL,
                    fileURL,
                    replies: [] // Initialize the replies field as an empty array
                };

                const docRef = await addDoc(collection(firestore, "comments"), newComment);
                console.log("Document written with ID: ", docRef.id);

                setEditorContent(""); // Clear the editor content
                setFile(null);
                onCommentAdded();
            } catch (e) {
                console.error("Error adding document: ", e);
            }
        }
    };

    const addReply = async (commentId) => {
        try {
            const commentRef = doc(firestore, "comments", commentId);

            const reply = {
                text: editorContent,
                userName: user.displayName,
                userPhoto: user.photoURL,
                createdAt: Timestamp.now(),
            };

            await updateDoc(commentRef, {
                replies: arrayUnion(reply) // Add the new reply to the replies array
            });

            console.log("Reply added successfully!");
        } catch (e) {
            console.error("Error adding reply: ", e);
        }
    };

    return (
        <FormControl sx={{ 
            position: 'relative', 
            width: '100%', 
            display: 'flex', 
            flexDirection: 'column', 
            borderRadius: '20px', 
            overflow: 'hidden' 
        }}>
            <div
                ref={editorRef}
                contentEditable
                onInput={(e) => setEditorContent(e.currentTarget.textContent)}
                onKeyUp={handleKeyUp}
                style={{ 
                    border: '1px solid #0000003D', 
                    borderRadius: '20px', 
                    minHeight: '100px', 
                    padding: '10px',
                    paddingBottom: '50px', 
                    overflowY: 'auto'
                }}
            />
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    border: '1px solid #0000003D', 
                    borderTop: '1px solid black',
                    backgroundColor: 'white',
                    padding: '5px 10px',
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                }}
            >
                <IconButton
                    variant="plain"
                    color="outlined"
                    onClick={() => handleFormat('bold')}
                >
                    <FormatBold />
                </IconButton>
                <IconButton
                    variant="plain"
                    color="outlined"
                    onClick={() => handleFormat('italic')}
                >
                    <FormatItalic />
                </IconButton>
                <IconButton
                    variant="plain"
                    color="outlined"
                    onClick={() => handleFormat('underline')}
                >
                    <FormatUnderlined />
                </IconButton>
                <IconButton
                    component="label"
                    variant="plain"
                    color="outlined"
                >
                    <AttachFile />
                    <input
                        type="file"
                        hidden
                        onChange={handleFileChange}
                    />
                </IconButton>
                <Button
                    onClick={handleSend}
                    sx={{
                        minWidth: '50px',
                        height: '30px',
                        backgroundColor: 'black',
                        color: 'white',
                        ml: 'auto',
                        borderRadius: '20px'
                    }}
                >
                    Send
                </Button>
            </Box>
            {mentionList.length > 0 && (
                <div style={{ 
                    border: '1px solid #ccc', 
                    position: 'absolute', 
                    bottom: '60px', 
                    backgroundColor: 'white', 
                    zIndex: 10, 
                    width: '100%',
                    borderRadius: '20px', 
                    overflow: 'hidden' 
                }}>
                    {mentionList.map(user => (
                        <div 
                            key={user.id} 
                            onClick={() => handleMentionClick(user.displayName)}
                            style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #ccc' }}
                        >
                            {user.displayName}
                        </div>
                    ))}
                </div>
            )}
        </FormControl>
    );
};

export default CommentsInput;
