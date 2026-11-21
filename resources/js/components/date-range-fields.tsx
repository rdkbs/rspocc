import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';

type DateRangeField = {
    id: string;
    name: string;
    label: string;
    value: string;
    error?: string;
};

export default function DateRangeFields({
    start,
    end,
    min,
    max,
}: {
    start: DateRangeField;
    end: DateRangeField;
    min: string;
    max: string;
}) {
    return (
        <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ alignItems: { sm: 'flex-start' } }}
        >
            <TextField
                type="date"
                id={start.id}
                name={start.name}
                label={start.label}
                defaultValue={start.value}
                slotProps={{
                    inputLabel: { shrink: true },
                    htmlInput: { min, max },
                }}
                error={Boolean(start.error)}
                helperText={start.error}
            />
            <TextField
                type="date"
                id={end.id}
                name={end.name}
                label={end.label}
                defaultValue={end.value}
                slotProps={{
                    inputLabel: { shrink: true },
                    htmlInput: { min, max },
                }}
                error={Boolean(end.error)}
                helperText={end.error}
            />
        </Stack>
    );
}
