import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import InputField from '../components/InputField';
import StarRating from '../components/StarRating';
import { fetchMyProfile, updateMyProfile } from '../services/profileService';
import type { MyProfile } from '../services/profileService';
import { deleteRating } from '../services/movieService';
import { getApiErrorMessage } from '../utils/errors';

const ProfileScreen = () => {
  const [data, setData] = useState<MyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // פרטים אישיים לעריכה
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const load = async () => {
    try {
      const profile = await fetchMyProfile();
      setData(profile);
      setFirstName(profile.profile?.firstName ?? '');
      setLastName(profile.profile?.lastName ?? '');
      setPhoneNumber(profile.profile?.phoneNumber ?? '');
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaveMessage('');
    if (!firstName.trim() || !lastName.trim()) {
      setSaveMessage('נא למלא שם פרטי ושם משפחה');
      return;
    }
    setSaving(true);
    try {
      await updateMyProfile({ firstName, lastName, phoneNumber });
      setSaveMessage('הפרטים נשמרו בהצלחה');
    } catch (err) {
      setSaveMessage(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRating = async (movieId: string) => {
    try {
      await deleteRating(movieId);
      await load(); // ריענון סטטיסטיקות והיסטוריה
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  if (loading) {
    return <p className="py-16 text-center text-zinc-500">טוען פרופיל...</p>;
  }

  if (!data) {
    return (
      <p className="mx-auto max-w-md py-16 text-center text-brand-400">
        {error || 'שגיאה בטעינת הפרופיל'}
      </p>
    );
  }

  const initials =
    (data.profile ? `${data.profile.firstName.charAt(0)}${data.profile.lastName.charAt(0)}` : '') ||
    data.user.email.charAt(0).toUpperCase();

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      {/* כותרת */}
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-500 text-2xl font-black text-white">
          {initials}
        </div>
        <div>
          <h1 className="text-2xl font-black text-zinc-50">
            {data.profile ? `${data.profile.firstName} ${data.profile.lastName}` : data.user.email}
          </h1>
          <p className="text-sm text-zinc-500">{data.user.email}</p>
          {data.user.role === 'admin' && (
            <span className="mt-1 inline-block rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-400">
              מנהל מערכת
            </span>
          )}
        </div>
      </div>

      {/* סטטיסטיקות */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        {[
          { value: data.stats.ratingsCount, label: 'דירוגים' },
          { value: data.stats.avgScore, label: 'ממוצע שלי' },
          { value: data.stats.categoriesCount, label: 'קטגוריות' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-surface-700 bg-surface-900 p-4 text-center"
          >
            <div className="text-3xl font-black text-brand-400">{stat.value}</div>
            <div className="mt-1 text-sm text-zinc-500">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Personal details */}
        <section>
          <h2 className="mb-4 text-xl font-bold text-zinc-50">פרטים אישיים</h2>
          <form onSubmit={handleSave} noValidate className="flex flex-col gap-4">
            <InputField
              label="שם פרטי"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <InputField
              label="שם משפחה"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
            <InputField
              label="טלפון (אופציונלי)"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              dir="ltr"
            />
            {saveMessage && (
              <p
                className={`text-sm ${
                  saveMessage.includes('בהצלחה') ? 'text-emerald-400' : 'text-brand-400'
                }`}
              >
                {saveMessage}
              </p>
            )}
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-brand-500 py-2.5 font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
            >
              {saving ? 'שומר...' : 'שמירת פרטים'}
            </button>
          </form>
        </section>

        {/* Rating history */}
        <section>
          <h2 className="mb-4 text-xl font-bold text-zinc-50">
            הדירוגים שלי ({data.ratings.length})
          </h2>
          {data.ratings.length === 0 ? (
            <p className="text-sm text-zinc-500">
              עדיין לא דירגת סרטים -{' '}
              <Link to="/" className="text-brand-400 hover:underline">
                לקטלוג
              </Link>
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {data.ratings.map((rating) => (
                <li
                  key={rating.id}
                  className="flex items-center gap-3 rounded-lg border border-surface-700 bg-surface-900 p-3"
                >
                  {rating.movie.imageUrl ? (
                    <img
                      src={rating.movie.imageUrl}
                      alt=""
                      className="h-14 w-10 rounded object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-10 items-center justify-center rounded bg-surface-800 font-bold text-surface-700">
                      {rating.movie.title.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-zinc-100">
                      {rating.movie.title}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {new Date(rating.updatedAt).toLocaleDateString('he-IL')}
                    </div>
                  </div>
                  <StarRating value={rating.score} />
                  <button
                    type="button"
                    onClick={() => handleDeleteRating(rating.movie.id)}
                    aria-label={`מחיקת הדירוג של ${rating.movie.title}`}
                    className="text-zinc-600 transition-colors hover:text-brand-400"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
};

export default ProfileScreen;
