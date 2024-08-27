// CommentsInput.js
import React, { useState } from 'react';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import Textarea from '@mui/joy/Textarea';
import IconButton from '@mui/joy/IconButton';
import Menu from '@mui/joy/Menu';
import MenuItem from '@mui/joy/MenuItem';
import ListItemDecorator from '@mui/joy/ListItemDecorator';
import FormatBold from '@mui/icons-material/FormatBold';
import FormatItalic from '@mui/icons-material/FormatItalic';
import FormatUnderlined from '@mui/icons-material/FormatUnderlined';
import AttachFile from '@mui/icons-material/AttachFile';
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown';
import Check from '@mui/icons-material/Check';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { firestore, auth, storage } from '../firebase'; // Make sure to import storage from your firebase config
import { useAuthState } from 'react-firebase-hooks/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // Firebase storage imports

const CommentsInput = ({ onCommentAdded }) => {
    const [user] = useAuthState(auth);
    const [italic, setItalic] = useState(false);
    const [underline, setUnderline] = useState(false);
    const [fontWeight, setFontWeight] = useState('normal');
    const [anchorEl, setAnchorEl] = useState(null);
    const [comment, setComment] = useState(""); // State to store the comment
    const [file, setFile] = useState(null); // State to store the uploaded file

    // Function to handle file selection
    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    // Function to handle comment submission
    const handleSend = async () => {
        if (comment.trim() || file) {
            let fileURL = "";
            if (file) {
                const fileRef = ref(storage, `attachments/${file.name}`);
                await uploadBytes(fileRef, file);
                fileURL = await getDownloadURL(fileRef);
            }

            try {
                const newComment = {
                    text: comment,
                    createdAt: Timestamp.now(),
                    fontWeight,
                    italic,
                    underline,
                    userName: user.displayName,
                    userPhoto: user.photoURL,
                    fileURL, // Store the file URL
                };
                console.log(newComment);

                const docRef = await addDoc(collection(firestore, "comments"), newComment);
                console.log("Document written with ID: ", docRef.id);

                // Reset input fields
                setComment("");
                setItalic(false);
                setUnderline(false);
                setFontWeight('normal');
                setFile(null); // Reset file input

                // Notify parent component to fetch new comments
                onCommentAdded();
            } catch (e) {
                console.error("Error adding document: ", e);
            }
        }
    };

    return (
        <FormControl sx={{ position: 'relative' }}>
            <FormLabel>Your comment</FormLabel>
            <Textarea
                placeholder="Type something here…"
                minRows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                endDecorator={
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--Textarea-paddingBlock)',
                            pt: 'var(--Textarea-paddingBlock)',
                            borderTop: '2px solid',
                            borderColor: 'black',
                            width: '100%',
                            justifyContent: 'flex-start',
                        }}
                    >
                        <Button
                            onClick={handleSend}
                            sx={{
                                minWidth: '50px',
                                height: '30px',
                                backgroundColor: 'black',
                                color: 'white',
                            }}
                        >
                            Send
                        </Button>
                        <IconButton
                            variant="plain"
                            color="outlined"
                            onClick={(event) => setAnchorEl(event.currentTarget)}
                        >
                            <FormatBold />
                            <KeyboardArrowDown fontSize="md" />
                        </IconButton>
                        <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={() => setAnchorEl(null)}
                            size="sm"
                            placement="bottom-start"
                            sx={{ '--ListItemDecorator-size': '24px' }}
                        >
                            {['200', 'normal', 'bold'].map((weight) => (
                                <MenuItem
                                    key={weight}
                                    selected={fontWeight === weight}
                                    onClick={() => {
                                        setFontWeight(weight);
                                        setAnchorEl(null);
                                    }}
                                    sx={{ fontWeight: weight }}
                                >
                                    <ListItemDecorator>
                                        {fontWeight === weight && <Check fontSize="sm" />}
                                    </ListItemDecorator>
                                    {weight === '200' ? 'lighter' : weight}
                                </MenuItem>
                            ))}
                        </Menu>
                        <IconButton
                            variant={italic ? 'soft' : 'plain'}
                            color={italic ? 'primary' : 'neutral'}
                            aria-pressed={italic}
                            onClick={() => setItalic((bool) => !bool)}
                        >
                            <FormatItalic />
                        </IconButton>
                        <IconButton
                            variant={underline ? 'soft' : 'plain'}
                            color={underline ? 'primary' : 'neutral'}
                            aria-pressed={underline}
                            onClick={() => setUnderline((bool) => !bool)}
                        >
                            <FormatUnderlined />
                        </IconButton>
                        <IconButton
                            component="label" // Add this to trigger file input
                            variant="plain"
                            color="outlined"
                        >
                            <AttachFile />
                            <input
                                type="file"
                                hidden
                                onChange={handleFileChange} // Attach the file change handler
                            />
                        </IconButton>
                    </Box>
                }
                sx={{
                    minWidth: 300,
                    fontWeight,
                    fontStyle: italic ? 'italic' : 'initial',
                    textDecoration: underline ? 'underline' : 'initial',
                }}
            />
        </FormControl>
    );
};

export default CommentsInput;
