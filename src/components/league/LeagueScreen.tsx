"use client";

import { ReferenceArt } from "@/components/layout/ReferenceArt";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { clearSession, storedUser, updateStoredUser, type SessionUser } from "@/lib/auth";
import { monthCopy, type Champion, type LeagueMonth } from "@/lib/monthlyLeague";
import { BASE_PATH } from "@/lib/site";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";

const SHOW_REGISTERED_FROM = 100;

type Row = {
  rank: number;
  username: string;
  avatar_id: number | null;
  points: number;
  played: number;
  maalloes_total: number;
  xi_solved: number;
  finn_points: number;
};

type FriendLeagueSummary = {
  id: string;
  name: string;
  code: string;
  ownerUserId: string;
  ownerUsername: string;
  memberCount: number;
  isOwner: boolean;
};

type FriendRow = {
  rank: number;
  userId: string;
  username: string;
  avatarId: number | null;
  points: number;
  played: number;
  maalloesTotal: number;
  xiSolved: number;
  finnPoints: number;
};

type FriendLeagueDetail = {
  id: string;
  name: string;
  code: string;
  ownerUserId: string;
  ownerUsername: string;
  isOwner: boolean;
  month: LeagueMonth;
  rows: FriendRow[];
};

export function LeagueScreen() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [me, setMe] = useState<Row | null>(null);
  const [registered, setRegistered] = useState<number | null>(null);
  const [month, setMonth] = useState<{ month: LeagueMonth; champion: Champion } | null>(null);
  const [boardStatus, setBoardStatus] = useState<"loading" | "ready" | "error">("loading");
  const [tab, setTab] = useState<"global" | "friends">("global");
  const [friendLeagues, setFriendLeagues] = useState<FriendLeagueSummary[]>([]);
  const [selected, setSelected] = useState<FriendLeagueDetail | null>(null);
  const [friendStatus, setFriendStatus] = useState<"idle" | "loading" | "error">("idle");
  const [createName, setCreateName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [renameName, setRenameName] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const boardRequest = useRef(0);

  const load = useCallback(async () => {
    const request = ++boardRequest.current;
    setBoardStatus("loading");
    try {
      const response = await apiGet<{
        ok: boolean;
        rows: Row[];
        me: Row | null;
        registered: number;
        month?: LeagueMonth;
        champion?: Champion;
      }>("/leaderboard");
      if (!response.ok) throw new Error("Leaderboard unavailable");
      if (request !== boardRequest.current) return;
      setRows(response.rows);
      setMe(response.me ?? null);
      setMonth(response.month ? { month: response.month, champion: response.champion ?? null } : null);
      setRegistered(typeof response.registered === "number" ? response.registered : null);
      setBoardStatus("ready");
    } catch {
      if (request === boardRequest.current) setBoardStatus("error");
    }
  }, []);

  const loadFriendList = useCallback(async () => {
    if (!storedUser()) return;
    setFriendStatus("loading");
    try {
      const response = await apiGet<{ ok: boolean; leagues?: FriendLeagueSummary[] }>("/friend-leagues");
      if (!response.ok) throw new Error("friend leagues unavailable");
      setFriendLeagues(response.leagues ?? []);
      setFriendStatus("idle");
    } catch {
      setFriendStatus("error");
    }
  }, []);

  const loadFriend = useCallback(async (code: string) => {
    if (!code) return;
    setFriendStatus("loading");
    setMessage("");
    try {
      const response = await apiGet<{ ok: boolean; league?: FriendLeagueDetail; error?: string }>(
        "/friend-league?code=" + encodeURIComponent(code),
      );
      if (!response.ok || !response.league) throw new Error(response.error ?? "not-found");
      setSelected(response.league);
      setRenameName(response.league.name);
      setFriendStatus("idle");
    } catch {
      setSelected(null);
      setFriendStatus("error");
      setMessage("Freundesliga nicht gefunden, oder du bist kein Mitglied.");
    }
  }, []);

  useEffect(() => {
    setUser(storedUser());
    void load();

    const join = new URLSearchParams(window.location.search).get("join");
    if (join) {
      setTab("friends");
      setJoinCode(join.toUpperCase());
    }

    const local = storedUser();
    if (!local) return;
    void apiGet<{ ok: boolean; user?: SessionUser }>("/auth/me")
      .then((response) => {
        if (response.ok && response.user) {
          updateStoredUser(response.user);
          setUser(response.user);
          void loadFriendList();
        } else {
          clearSession();
          setUser(null);
        }
      })
      .catch(() => {});
  }, [load, loadFriendList]);

  useEffect(() => {
    if (tab === "friends" && user) void loadFriendList();
  }, [tab, user, loadFriendList]);

  const createLeague = async (event: FormEvent) => {
    event.preventDefault();
    if (!createName.trim()) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await apiPost<{ ok: boolean; league?: FriendLeagueDetail; error?: string }>(
        "/friend-league/create",
        { name: createName },
      );
      if (!response.ok || !response.league) {
        setMessage(response.error === "limit" ? "Du bist schon in der maximalen Anzahl von Freundesligen." : "Die Liga konnte nicht gegründet werden.");
        return;
      }
      setCreateName("");
      setSelected(response.league);
      setRenameName(response.league.name);
      await loadFriendList();
      setMessage("Freundesliga gegründet. Teile den Code oder den Einladungslink mit deinen Freunden.");
    } catch {
      setMessage("Die Liga konnte gerade nicht gegründet werden.");
    } finally {
      setBusy(false);
    }
  };

  const joinLeague = async (event: FormEvent) => {
    event.preventDefault();
    if (!joinCode.trim()) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await apiPost<{ ok: boolean; league?: FriendLeagueDetail; error?: string }>(
        "/friend-league/join",
        { code: joinCode },
      );
      if (!response.ok || !response.league) {
        setMessage(
          response.error === "not-found"
            ? "Keine Freundesliga mit diesem Code gefunden."
            : response.error === "limit"
              ? "Du bist schon in der maximalen Anzahl von Freundesligen."
              : "Beitritt zur Liga nicht möglich.",
        );
        return;
      }
      setSelected(response.league);
      setRenameName(response.league.name);
      setJoinCode(response.league.code);
      await loadFriendList();
      setMessage("Du bist jetzt in " + response.league.name + ".");
      window.history.replaceState({}, "", BASE_PATH + "/liga/");
    } catch {
      setMessage("Beitritt zur Liga gerade nicht möglich.");
    } finally {
      setBusy(false);
    }
  };

  const mutateLeague = async (
    route: string,
    body: Record<string, unknown>,
    successMessage: string,
    clearOnSuccess = false,
  ) => {
    if (!selected) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await apiPost<{ ok: boolean; league?: FriendLeagueDetail; error?: string }>(route, body);
      if (!response.ok) {
        setMessage("Die Änderung konnte nicht ausgeführt werden.");
        return;
      }
      if (clearOnSuccess) {
        setSelected(null);
      } else if (response.league) {
        setSelected(response.league);
        setRenameName(response.league.name);
      }
      await loadFriendList();
      setMessage(successMessage);
    } catch {
      setMessage("Die Änderung konnte gerade nicht ausgeführt werden.");
    } finally {
      setBusy(false);
    }
  };

  const renameLeague = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected || !renameName.trim()) return;
    await mutateLeague(
      "/friend-league/rename",
      { code: selected.code, name: renameName },
      "Der Liganame wurde aktualisiert.",
    );
  };

  const shareLeague = async () => {
    if (!selected) return;
    const inviteUrl = window.location.origin + BASE_PATH + "/liga/?join=" + encodeURIComponent(selected.code);
    const text = `Spiel mit in der Freundesliga „${selected.name}“ auf Quizkaiser. Code: ${selected.code}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: selected.name + " – Quizkaiser", text, url: inviteUrl });
        return;
      }
      await navigator.clipboard.writeText(inviteUrl);
      setMessage("Der Einladungslink wurde kopiert.");
    } catch {
      // User cancelling the native share sheet should not be treated as an error.
    }
  };

  const copyCode = async () => {
    if (!selected) return;
    try {
      await navigator.clipboard.writeText(selected.code);
      setMessage("Der Ligacode wurde kopiert.");
    } catch {
      setMessage("Kode: " + selected.code);
    }
  };

  const copy = month ? monthCopy(month.month, month.champion) : null;

  return (
    <div className="league-reference-page flex flex-col gap-4">
      <section className="league-reference-hero"><div className="reference-hero-art"><ReferenceArt name="leagueHero" /></div>
        <h1 className="font-display text-4xl font-bold uppercase">Liga und Profil</h1>
        <p className="mt-2 text-mist">
          Verfolge deine Freundesliga, prüfe deinen Platz und verwalte dein Profil. Fußball ist zusammen am schönsten!
        </p>
      </section>

      <div className="league-reference-tabs flex gap-2">
        <button className={`btn ${tab === "global" ? "btn-primary" : "btn-secondary"}`} onClick={() => setTab("global")}>
          Bestenliste
        </button>
        <button className={`btn ${tab === "friends" ? "btn-primary" : "btn-secondary"}`} onClick={() => setTab("friends")}>
          Freundesligen
        </button>
      </div>

      {tab === "global" ? (
        <LeagueDashboard
          user={user}
          rows={rows}
          me={me}
          registered={registered}
          boardStatus={boardStatus}
          monthLabel={copy?.month ?? "diesen Monat"}
          selected={selected}
          createName={createName}
          joinCode={joinCode}
          message={message}
          busy={busy}
          onCreateName={setCreateName}
          onJoinCode={(value) => setJoinCode(value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12))}
          onCreate={createLeague}
          onJoin={joinLeague}
          onRetry={() => void load()}
        />
      ) : (
        <FriendLeagues
          user={user}
          leagues={friendLeagues}
          selected={selected}
          status={friendStatus}
          createName={createName}
          joinCode={joinCode}
          renameName={renameName}
          message={message}
          busy={busy}
          onCreateName={setCreateName}
          onJoinCode={(value) => setJoinCode(value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12))}
          onRenameName={setRenameName}
          onCreate={createLeague}
          onJoin={joinLeague}
          onSelect={(league) => void loadFriend(league.code)}
          onRename={renameLeague}
          onShare={() => void shareLeague()}
          onCopyCode={() => void copyCode()}
          onRegenerate={() => {
            if (selected && window.confirm("Einen neuen Code erstellen? Der alte Einladungslink funktioniert dann nicht mehr.")) {
              void mutateLeague(
                "/friend-league/regenerate",
                { code: selected.code },
                "Ein neuer Ligacode wurde erstellt.",
              );
            }
          }}
          onKick={(row) => {
            if (selected && window.confirm(row.username + " aus der Liga entfernen?")) {
              void mutateLeague(
                "/friend-league/kick",
                { code: selected.code, userId: row.userId },
                row.username + " wurde aus der Liga entfernt.",
              );
            }
          }}
          onLeave={() => {
            if (selected && window.confirm("Forlate " + selected.name + "?")) {
              void mutateLeague(
                "/friend-league/leave",
                { code: selected.code },
                "Du hast die Freundesliga verlassen.",
                true,
              );
            }
          }}
          onDelete={() => {
            if (selected && window.confirm("Die Freundesliga endgültig löschen? Das lässt sich nicht rückgängig machen.")) {
              void mutateLeague(
                "/friend-league/delete",
                { code: selected.code },
                "Die Freundesliga wurde gelöscht.",
                true,
              );
            }
          }}
        />
      )}
    </div>
  );
}


function LeagueDashboard(props: {
  user: SessionUser | null;
  rows: Row[];
  me: Row | null;
  registered: number | null;
  boardStatus: "loading" | "ready" | "error";
  monthLabel: string;
  selected: FriendLeagueDetail | null;
  createName: string;
  joinCode: string;
  message: string;
  busy: boolean;
  onCreateName: (value: string) => void;
  onJoinCode: (value: string) => void;
  onCreate: (event: FormEvent) => void;
  onJoin: (event: FormEvent) => void;
  onRetry: () => void;
}) {
  const friendRows = props.selected?.rows ?? [];
  const compactRows = friendRows.length
    ? friendRows.slice(0, 10).map((row) => ({
        rank: row.rank,
        username: row.username,
        avatarId: row.avatarId,
        points: row.points,
        played: row.played,
      }))
    : props.rows.slice(0, 10).map((row) => ({
        rank: row.rank,
        username: row.username,
        avatarId: row.avatar_id,
        points: row.points,
        played: row.played,
      }));

  return (
    <div className="league-dashboard">
      <section className="league-profile-summary">
        <div className="league-card-heading">
          <h2>Mein Profil</h2>
          <Link href="/profil/">Profil bearbeiten <span aria-hidden="true">→</span></Link>
        </div>
        {props.user ? (
          <>
            <div className="league-profile-identity">
              <ProfileAvatar avatarId={props.me?.avatar_id ?? null} size={76} />
              <div>
                <strong>{props.user.username}</strong>
                <span>Dein Quizkaiser-Profil</span>
              </div>
            </div>
            <div className="league-profile-stats">
              <div><b>{(props.me?.points ?? 0).toLocaleString("de-DE")}</b><span>Punkte diesen Monat</span></div>
              <div><b>{props.me?.played ?? 0}</b><span>Spiele eingetragen</span></div>
            </div>
            <div className="league-profile-progress">
              <span>Form des Monats</span>
              <div><i style={{ width: `${Math.min(100, Math.max(8, (props.me?.points ?? 0) / 30))}%` }} /></div>
            </div>
            <Link href="/profil/" className="league-profile-cta">Profil ansehen und bearbeiten</Link>
          </>
        ) : (
          <div className="league-profile-empty">
            <strong>Mit eigenem Profil spielen</strong>
            <p>Melde dich an, um Punkte zu speichern, Freundesligen beizutreten und einen Avatar zu bekommen.</p>
            <Link href="/profil/#login" className="btn btn-primary">Anmelden</Link>
          </div>
        )}
        <div className="league-profile-illustration"><ReferenceArt name="profile" /></div>
      </section>

      <section className="league-main-board">
        <div className="league-main-title">
          <div className="league-group-icon" aria-hidden="true">●●●</div>
          <div>
            <h2>{props.selected?.name ?? "Die Monatsliga"}</h2>
            <p>{props.selected ? `Ein Kampf um Ehre und Fußballwissen. ${props.selected.rows.length} Spieler.` : "Offene Monatsliga für alle registrierten Spieler."}</p>
          </div>
        </div>

        {props.boardStatus === "loading" && !compactRows.length ? (
          <p className="league-board-status" role="status">Liga wird geladen …</p>
        ) : props.boardStatus === "error" && !compactRows.length ? (
          <div className="league-board-status" role="status">
            <p>Die Liga konnte nicht geladen werden.</p>
            <button className="underline" onClick={props.onRetry}>Erneut versuchen</button>
          </div>
        ) : compactRows.length ? (
          <table className="league-compact-table">
            <thead><tr><th>Platz</th><th>Spieler</th><th>Runde</th><th>Gesamt</th></tr></thead>
            <tbody>
              {compactRows.map((row) => (
                <tr key={row.username} aria-current={props.user?.username === row.username ? "true" : undefined}>
                  <td>{row.rank === 1 ? "♛" : row.rank}</td>
                  <th><ProfileAvatar avatarId={row.avatarId} size={28} /><span>{row.username}</span></th>
                  <td>{row.played}</td>
                  <td>{row.points.toLocaleString("de-DE")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="league-board-status">Noch keine Punkte. Sei der Erste in der Tabelle.</p>
        )}

        <div className="league-main-footer">
          <span>{props.selected ? "Freundesliga" : "Offene Monatsliga"} · {props.monthLabel}</span>
          <button type="button" onClick={() => document.getElementById("full-league-board")?.scrollIntoView({ behavior: "smooth" })}>
            Ganze Liga ansehen <span aria-hidden="true">→</span>
          </button>
        </div>
      </section>

      <aside className="league-side-actions">
        <section className="league-action-card league-create-card">
          <h2>Gründe deine eigene Freundesliga</h2>
          <p>Spiel gegen Freunde, Kollegen oder die ganze Fußballclique. Wer weiß am meisten?</p>
          {props.user ? (
            <form onSubmit={props.onCreate}>
              <input className="input" value={props.createName} onChange={(e) => props.onCreateName(e.target.value)} placeholder="Name der Liga" maxLength={40} aria-label="Name der Freundesliga" />
              <button className="btn btn-primary" disabled={props.busy || !props.createName.trim()}>Liga gründen <span aria-hidden="true">→</span></button>
            </form>
          ) : (
            <Link href="/profil/#login" className="btn btn-primary">Zum Gründen anmelden <span aria-hidden="true">→</span></Link>
          )}
          <div className="league-friends-art"><ReferenceArt name="friends" /></div>
        </section>

        <section className="league-action-card league-join-card">
          <h2>Einer Freundesliga beitreten</h2>
          <p>Hast du einen Ligacode von einem Freund?</p>
          {props.user ? (
            <form onSubmit={props.onJoin}>
              <input className="input" value={props.joinCode} onChange={(e) => props.onJoinCode(e.target.value)} placeholder="Ligacode eingeben (z. B. AB12CD)" autoCapitalize="characters" aria-label="Ligacode" />
              <button className="btn btn-primary" disabled={props.busy || !props.joinCode.trim()}>Liga beitreten <span aria-hidden="true">→</span></button>
            </form>
          ) : (
            <Link href="/profil/#login" className="btn btn-secondary">Zuerst anmelden</Link>
          )}
        </section>

        <section className="league-action-card league-activity-card">
          <h2>Die Top-Spieler des Monats</h2>
          {props.rows.slice(0, 4).map((row, index) => (
            <div className="league-activity-row" key={row.username}>
              <span>{index === 0 ? "★" : "↗"}</span>
              <ProfileAvatar avatarId={row.avatar_id} size={25} />
              <p><b>{row.username}</b> hat {row.points.toLocaleString("de-DE")} Punkte</p>
            </div>
          ))}
        </section>
      </aside>

      {props.message && <p className="league-dashboard-message">{props.message}</p>}

      <section className="league-top-strip">
        <div className="league-top-strip-heading">
          <h2>🏆 Top 5 diesen Monat</h2>
          <button type="button" onClick={() => document.getElementById("full-league-board")?.scrollIntoView({ behavior: "smooth" })}>Ganze Top 100 ansehen <span aria-hidden="true">→</span></button>
        </div>
        <div className="league-top-five">
          {props.rows.slice(0, 5).map((row, index) => (
            <div key={row.username} aria-current={props.user?.username === row.username ? "true" : undefined}>
              <span>{index + 1}</span>
              <ProfileAvatar avatarId={row.avatar_id} size={34} />
              <p><b>{row.username}</b><small>{row.points.toLocaleString("de-DE")} Punkte</small></p>
            </div>
          ))}
          {!props.rows.length && <p className="text-mist">Noch keine Punkte eingetragen.</p>}
        </div>
      </section>

      <details className="league-full-board" id="full-league-board">
        <summary>Die ganze Top 100 – {props.monthLabel}</summary>
        {props.boardStatus === "ready" && props.rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-mist">
                <tr><th className="p-3">#</th><th className="p-3">Spieler</th><th className="p-3 text-right">Punkte</th><th className="p-3 text-right">Spiele</th></tr>
              </thead>
              <tbody>{props.rows.map((row) => <LeagueRow key={row.username} row={row} own={props.user?.username === row.username} />)}</tbody>
              {props.user && props.me && props.me.username === props.user.username && props.me.rank > 100 && (
                <tfoot className="border-t-2 border-line"><LeagueRow row={props.me} own /></tfoot>
              )}
            </table>
          </div>
        ) : (
          <p className="p-4 text-mist">Keine Rangliste verfügbar.</p>
        )}
        {props.registered !== null && props.registered >= SHOW_REGISTERED_FROM && (
          <p className="league-registered">{props.registered.toLocaleString("de-DE")} registrerte spillere</p>
        )}
      </details>
    </div>
  );
}

function LeagueRow({ row, own }: { row: Row; own: boolean }) {
  return (
    <tr className={`border-t border-line ${own ? "bg-sky/10 font-bold" : ""}`} aria-current={own ? "true" : undefined}>
      <td className="p-3 font-display text-lg">{row.rank}</td>
      <td className="p-3">
        <div className="flex min-w-0 items-center gap-2">
          <ProfileAvatar avatarId={row.avatar_id} size={34} />
          <span className="break-all">{row.username}</span>
        </div>
      </td>
      <td className="p-3 text-right font-display text-xl text-gold">{row.points}</td>
      <td className="p-3 text-right text-mist">{row.played}</td>
    </tr>
  );
}

function FriendLeagues(props: {
  user: SessionUser | null;
  leagues: FriendLeagueSummary[];
  selected: FriendLeagueDetail | null;
  status: "idle" | "loading" | "error";
  createName: string;
  joinCode: string;
  renameName: string;
  message: string;
  busy: boolean;
  onCreateName: (value: string) => void;
  onJoinCode: (value: string) => void;
  onRenameName: (value: string) => void;
  onCreate: (event: FormEvent) => void;
  onJoin: (event: FormEvent) => void;
  onSelect: (league: FriendLeagueSummary) => void;
  onRename: (event: FormEvent) => void;
  onShare: () => void;
  onCopyCode: () => void;
  onRegenerate: () => void;
  onKick: (row: FriendRow) => void;
  onLeave: () => void;
  onDelete: () => void;
}) {
  if (!props.user) {
    return (
      <section className="card p-5">
        <h2 className="font-display text-2xl font-bold uppercase">Freundesligen</h2>
        <p className="mt-2 text-mist">Du brauchst ein Quizkaiser-Profil und musst angemeldet sein, um eine Freundesliga zu gründen oder ihr beizutreten.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={props.joinCode ? "/profil/?join=" + encodeURIComponent(props.joinCode) + "#login" : "/profil/#login"} className="btn btn-primary">Anmelden</Link>
          <Link href={props.joinCode ? "/profil/?join=" + encodeURIComponent(props.joinCode) + "#register" : "/profil/#register"} className="btn btn-secondary">Profil anlegen</Link>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="grid gap-4 md:grid-cols-2">
        <form className="card p-5" onSubmit={props.onCreate}>
          <h2 className="font-display text-2xl font-bold uppercase">Freundesliga gründen</h2>
          <p className="mt-1 text-sm text-mist">Wähle einen Namen. Quizkaiser erstellt automatisch einen privaten Code.</p>
          <input
            className="input mt-4"
            value={props.createName}
            onChange={(e) => props.onCreateName(e.target.value)}
            placeholder="Z. B. Bolzplatz-Legenden"
            maxLength={40}
          />
          <button className="btn btn-primary mt-3 w-full" disabled={props.busy || !props.createName.trim()}>
            Liga gründen
          </button>
        </form>

        <form className="card p-5" onSubmit={props.onJoin}>
          <h2 className="font-display text-2xl font-bold uppercase">Beitreten</h2>
          <p className="mt-1 text-sm text-mist">Gib den Code ein, den du von einem Freund bekommen hast.</p>
          <input
            className="input mt-4 font-display text-xl uppercase tracking-widest"
            value={props.joinCode}
            onChange={(e) => props.onJoinCode(e.target.value)}
            placeholder="ABC123"
            autoCapitalize="characters"
          />
          <button className="btn btn-secondary mt-3 w-full" disabled={props.busy || !props.joinCode.trim()}>
            Liga beitreten
          </button>
        </form>
      </section>

      {props.message && <p className="card p-3 text-sm text-mist">{props.message}</p>}

      <section className="card p-5">
        <h2 className="font-display text-2xl font-bold uppercase">Meine Freundesligen</h2>
        {props.status === "loading" && !props.leagues.length ? (
          <p className="mt-3 text-mist">Freundesligen werden geladen …</p>
        ) : props.leagues.length ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {props.leagues.map((league) => (
              <button
                type="button"
                key={league.id}
                className={`rounded-xl border p-3 text-left transition ${props.selected?.id === league.id ? "border-gold bg-gold/10" : "border-line hover:border-sky"}`}
                onClick={() => props.onSelect(league)}
              >
                <div className="font-display text-xl font-bold">{league.name}</div>
                <div className="mt-1 flex justify-between text-xs text-mist">
                  <span>{league.memberCount} {league.memberCount === 1 ? "spiller" : "spillere"}</span>
                  <span>{league.isOwner ? "Du bist Besitzer" : "Besitzer: " + league.ownerUsername}</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-mist">Du bist noch in keiner Freundesliga.</p>
        )}
      </section>

      {props.selected && (
        <section className="card overflow-hidden">
          <div className="border-b border-line p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-3xl font-bold">{props.selected.name}</h2>
                <p className="text-sm text-mist">Dieselben Monatspunkte wie in der offenen Quizkaiser-Liga.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="btn btn-primary" type="button" onClick={props.onShare}>Liga teilen</button>
                <button className="btn btn-secondary" type="button" onClick={props.onCopyCode}>Code kopieren</button>
              </div>
            </div>
            <div className="mt-4 inline-flex items-center gap-3 rounded-xl border border-line px-4 py-2">
              <span className="text-xs uppercase tracking-widest text-mist">Code</span>
              <strong className="font-display text-2xl tracking-[0.2em] text-gold">{props.selected.code}</strong>
            </div>
          </div>

          {props.selected.rows.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-mist">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Spieler</th>
                    <th className="p-3 text-right">Punkte</th>
                    <th className="p-3 text-right">Spiele</th>
                    {props.selected.isOwner && <th className="p-3 text-right">Besitzer</th>}
                  </tr>
                </thead>
                <tbody>
                  {props.selected.rows.map((row) => (
                    <tr
                      key={row.userId}
                      className={`border-t border-line ${row.userId === props.user?.id ? "bg-sky/10 font-bold" : ""}`}
                    >
                      <td className="p-3 font-display text-lg">{row.rank}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <ProfileAvatar avatarId={row.avatarId} size={34} />
                          <span className="break-all">{row.username}</span>
                        </div>
                      </td>
                      <td className="p-3 text-right font-display text-xl text-gold">{row.points}</td>
                      <td className="p-3 text-right text-mist">{row.played}</td>
                      {props.selected?.isOwner && (
                        <td className="p-3 text-right">
                          {row.userId !== props.user?.id && (
                            <button className="text-xs text-mist underline" type="button" onClick={() => props.onKick(row)}>
                              Entfernen
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="p-5 text-mist">Noch keine Spieler in der Liga.</p>
          )}

          <div className="border-t border-line p-5">
            {props.selected.isOwner ? (
              <div className="space-y-4">
                <form className="flex flex-col gap-2 sm:flex-row" onSubmit={props.onRename}>
                  <input
                    className="input flex-1"
                    value={props.renameName}
                    onChange={(e) => props.onRenameName(e.target.value)}
                    maxLength={40}
                    aria-label="Neuer Liganame"
                  />
                  <button className="btn btn-secondary" disabled={props.busy}>Namen ändern</button>
                </form>
                <div className="flex flex-wrap gap-2">
                  <button className="btn btn-secondary" type="button" onClick={props.onRegenerate} disabled={props.busy}>
                    Neuen Code erstellen
                  </button>
                  <button className="btn btn-secondary" type="button" onClick={props.onDelete} disabled={props.busy}>
                    Liga löschen
                  </button>
                </div>
              </div>
            ) : (
              <button className="btn btn-secondary" type="button" onClick={props.onLeave} disabled={props.busy}>
                Liga verlassen
              </button>
            )}
          </div>
        </section>
      )}
    </>
  );
}
