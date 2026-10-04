"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";

type Row = { username: string; points: number; avatar_id?: number | null };
type Board = { ok: boolean; rows?: Row[] };

export function TopPlayers() {
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    apiGet<Board>("/leaderboard")
      .then((result) => {
        if (!result.ok || !result.rows) throw new Error("Missing leaderboard");
        if (active) { setRows(result.rows.slice(0, 5)); setStatus("ready"); }
      })
      .catch(() => { if (active) setStatus("error"); });
    return () => { active = false; };
  }, [retry]);

  return (
    <section className="home-leaderboard" aria-labelledby="top-players-heading">
      <div className="home-leaderboard-heading">
        <span className="home-trophy" aria-hidden="true">🏆</span>
        <h2 id="top-players-heading" className="font-display">Top 5 im letzten Monat</h2>
      </div>
      {status === "loading" ? (
        <p className="home-leaderboard-status" role="status">Bestenliste wird geladen …</p>
      ) : status === "error" ? (
        <div className="home-leaderboard-status" role="status">
          <p>Die Bestenliste konnte nicht geladen werden.</p>
          <button className="mt-2 underline" onClick={() => { setStatus("loading"); setRetry((n) => n + 1); }}>Erneut versuchen</button>
        </div>
      ) : rows.length ? (
        <table className="home-leaderboard-table">
          <thead><tr><th scope="col">#</th><th scope="col">Spieler</th><th scope="col">Punkte</th></tr></thead>
          <tbody>{rows.map((row, i) => (
            <tr key={row.username}>
              <td><span className="home-rank">{i + 1}</span></td>
              <th scope="row"><span className="inline-flex items-center gap-2"><ProfileAvatar avatarId={row.avatar_id} size={24} /><span>{row.username}</span></span></th>
              <td>{row.points.toLocaleString("de-DE")}</td>
            </tr>
          ))}</tbody>
        </table>
      ) : (
        <p className="home-leaderboard-status">Diesen Monat noch keine Punkte.</p>
      )}
      <div className="home-leaderboard-links">
        <Link href="/liga/">Ganze Liste ansehen <span aria-hidden="true">→</span></Link>
      </div>
    </section>
  );
}
