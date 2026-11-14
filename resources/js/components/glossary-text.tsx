import { useState } from 'react';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import { glossaryParts } from '@/glossary';

function Term({ text, definition }: { text: string; definition: string }) {
    const [open, setOpen] = useState(false);
    return (
        <ClickAwayListener onClickAway={() => setOpen(false)}>
            <Tooltip
                title={definition}
                describeChild
                open={open}
                onOpen={() => setOpen(true)}
                onClose={() => setOpen(false)}
                disableTouchListener
                arrow
            >
                <Box
                    component="button"
                    type="button"
                    onClick={() => setOpen(true)}
                    sx={{
                        display: 'inline',
                        font: 'inherit',
                        color: 'inherit',
                        bgcolor: 'transparent',
                        border: 0,
                        p: 0,
                        minHeight: 44,
                        textDecoration: 'underline dotted',
                        textUnderlineOffset: '4px',
                        cursor: 'help',
                        '&:hover': { color: 'primary.main' },
                    }}
                >
                    {text}
                </Box>
            </Tooltip>
        </ClickAwayListener>
    );
}
export default function GlossaryText({
    children,
    language = 'en',
}: {
    children: string;
    language?: 'id' | 'en';
}) {
    return (
        <>
            {glossaryParts(children).map((part, index) =>
                part.entry ? (
                    <Term
                        key={index}
                        text={part.text}
                        definition={part.entry[language]}
                    />
                ) : (
                    part.text
                ),
            )}
        </>
    );
}
