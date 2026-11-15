import { useState } from 'react';
import { sileo } from 'sileo';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const FIELDS_BY_TYPE = {
    announcement: [],
    news: [],
    event: [
        { name: 'eventDate', label: 'Event date and time', type: 'datetime-local' },
        { name: 'location', label: 'Location', type: 'text' },
    ],
    competition: [
        { name: 'deadline', label: 'Registration deadline', type: 'date' },
        { name: 'link', label: 'Registration link', type: 'url' },
    ],
};

const EMPTY_FORM = {
    type: 'announcement',
    title: '',
    description: '',
    eventDate: '',
    location: '',
    deadline: '',
    link: '',
};

export default function AnnouncementForm({ isOpen, onClose, onCreated }) {
    const [values, setValues] = useState(EMPTY_FORM);
    const [banner, setBanner] = useState(null);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    const token = localStorage.getItem('token');
    const extraFields = FIELDS_BY_TYPE[values.type];

    function updateField(name, value) {
        setValues((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: undefined }));
    }

    function resetAndClose() {
        setValues(EMPTY_FORM);
        setBanner(null);
        setErrors({});
        onClose();
    }

    function validate() {
        const next = {};

        if (!values.title.trim()) next.title = 'Title is required.';
        if (!values.description.trim()) next.description = 'Description is required.';

        extraFields.forEach((field) => {
            if (!values[field.name]) next[field.name] = `${field.label} is required.`;
        });

        setErrors(next);

        if (Object.keys(next).length > 0) {
            sileo.warning({
                title: 'Missing details',
                description: 'Fill in the required fields before publishing.',
            });
            return false;
        }

        return true;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!validate()) return;

        setSaving(true);

        const formData = new FormData();
        Object.entries(values).forEach(([key, value]) => formData.append(key, value));
        if (banner) formData.append('banner', banner);

        try {
            const res = await fetch(`${API}/announcement`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Could not publish the announcement.');
            }

            sileo.success({
                title: 'Announcement published',
                description: data.announcement.title,
            });

            onCreated(data.announcement);
            resetAndClose();
        } catch (err) {
            sileo.error({
                title: 'Could not publish',
                description: err.message,
            });
        } finally {
            setSaving(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && resetAndClose()}>
            <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto bg-[#1D201A] sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="font-heading text-xl">New note</DialogTitle>
                    <DialogDescription>
                        Share an announcement, event, competition, or news. Only an admin can publish.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="type">Category</Label>
                        <select
                            id="type"
                            value={values.type}
                            onChange={(e) => updateField('type', e.target.value)}
                            className="h-9 w-full bg-[#252820] px-2.5 text-sm outline-none"
                        >
                            <option value="announcement">Announcement</option>
                            <option value="event">Event</option>
                            <option value="competition">Competition</option>
                            <option value="news">News</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            value={values.title}
                            onChange={(e) => updateField('title', e.target.value)}
                            aria-invalid={Boolean(errors.title)}
                            className="h-9"
                        />
                        {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            rows={4}
                            value={values.description}
                            onChange={(e) => updateField('description', e.target.value)}
                            aria-invalid={Boolean(errors.description)}
                        />
                        {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
                    </div>

                    {extraFields.map((field) => (
                        <div key={field.name} className="space-y-1.5">
                            <Label htmlFor={field.name}>{field.label}</Label>
                            <Input
                                id={field.name}
                                type={field.type}
                                value={values[field.name]}
                                onChange={(e) => updateField(field.name, e.target.value)}
                                aria-invalid={Boolean(errors[field.name])}
                                className="h-9"
                            />
                            {errors[field.name] && <p className="text-xs text-destructive">{errors[field.name]}</p>}
                        </div>
                    ))}

                    <div className="space-y-1.5">
                        <Label htmlFor="banner">Banner image</Label>
                        <Input
                            id="banner"
                            type="file"
                            accept="image/*"
                            onChange={(e) => setBanner(e.target.files?.[0] || null)}
                            className="h-9"
                        />
                        <p className="text-xs text-[#A6A397]">Optional. Uploaded with the note.</p>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={resetAndClose} disabled={saving}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={saving}>
                            {saving ? 'Publishing...' : 'Publish'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
