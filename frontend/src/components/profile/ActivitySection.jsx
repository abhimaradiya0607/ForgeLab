import { useEffect, useState } from "react";
import axios from "axios";
import { ActivityHeatmap } from "@/components/ui/activity-heatmap";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const BRAND = "#C7F36B";

export default function ActivitySection({ userId }) {
    const [activity, setActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!userId) return;

        let cancelled = false;

        async function loadActivity() {
            try {
                setLoading(true);
                setError("");

                const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
                const token = localStorage.getItem("token");

                const res = await axios.get(`${API_URL}/userProfile/${userId}/activity`, {
                    params: { tz },
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });

                if (!cancelled) setActivity(res.data.activity || []);
            } catch (err) {
                if (!cancelled) {
                    setError(err.response?.data?.message || "Could not load activity.");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadActivity();

        return () => {
            cancelled = true;
        };
    }, [userId]);

    return (
        <section className="dark mt-8 border border-[#33342D] bg-[#11120F] p-6 text-[#EDE9DF]">
            <div className="mb-6 flex items-center justify-between">
                <h2 className="font-heading text-2xl">Activity</h2>
                <span className="font-mono text-xs text-[#A6A397]">LAST 365 DAYS</span>
            </div>

            {loading && <p className="text-sm text-[#A6A397]">Loading activity...</p>}

            {!loading && error && <p className="text-sm text-red-400">{error}</p>}

            {!loading && !error && (
                <ActivityHeatmap data={activity} days={365} color={BRAND} unit="contributions" />
            )}
        </section>
    );
}