'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Stats } from '@/types/reservation';
import {
  MinecraftCharacter,
  MinecraftGrassBlock,
  MinecraftPickaxe,
  MinecraftDiamond,
  FloatingBlocks
} from '@/components/MinecraftDecorations';

interface WaitingReservation {
  queue_number: number;
  name: string;
}

export default function Home() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [waitingList, setWaitingList] = useState<WaitingReservation[]>([]);
  const router = useRouter();

  // 統計情報を取得
  const fetchStats = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('統計情報の取得に失敗しました', err);
    }
  };

  // 待機中のリストを取得
  const fetchWaitingList = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reservations/waiting/list`);
      if (response.ok) {
        const data = await response.json();
        setWaitingList(data);
      }
    } catch (err) {
      console.error('待機リストの取得に失敗しました', err);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchWaitingList();

    // 10秒ごとに自動更新
    const interval = setInterval(() => {
      fetchStats();
      fetchWaitingList();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('名前を入力してください');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!response.ok) {
        throw new Error('予約の作成に失敗しました');
      }

      const data = await response.json();

      // 待ち状況画面に遷移
      router.push(`/wait/${data.queue_number}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '予約の作成に失敗しました');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-100 via-blue-50 to-blue-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* 浮遊するマインクラフトブロック */}
      <FloatingBlocks />

      {/* 地面のブロック */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-2 pb-4">
        <MinecraftGrassBlock />
        <MinecraftGrassBlock />
        <MinecraftGrassBlock />
        <MinecraftGrassBlock />
        <MinecraftGrassBlock />
      </div>

      <div className="max-w-7xl w-full relative z-10">
        {/* PC画面では横並び、モバイルでは縦並び */}
        <div className="lg:grid lg:grid-cols-2 lg:gap-6">
          {/* 左側: 待ち状況表示 */}
          {stats && (
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 lg:mb-0">
              <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">
                現在の待ち状況
              </h2>

              {/* 体験時間超過の警告 */}
              {stats.overtime_seats && stats.overtime_seats.length > 0 && (
              <div className="bg-gradient-to-r from-red-100 to-orange-100 border-2 border-red-400 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="text-red-800 font-bold text-sm">体験時間超過</span>
                </div>
                <div className="space-y-2">
                  {stats.overtime_seats.map((seat) => (
                    <div key={seat.seat_name} className="bg-white bg-opacity-60 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-900">{seat.seat_name}</span>
                          <span className="text-sm text-gray-700">{seat.name}様</span>
                        </div>
                        <span className="text-sm font-bold text-red-600">
                          {Math.ceil(seat.overtime_minutes)}分超過
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-xs text-red-700">
                  スタッフにお声がけください
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* 待機中の人数 */}
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-300 rounded-xl p-4 text-center">
                <div className="text-yellow-800 text-sm font-semibold mb-1">待機中</div>
                <div className="text-5xl font-bold text-yellow-900">{stats.waiting_count}</div>
                <div className="text-yellow-700 text-xs mt-1">人</div>
              </div>

              {/* 体験中の人数 */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-xl p-4 text-center">
                <div className="text-green-800 text-sm font-semibold mb-1">体験中</div>
                <div className="text-5xl font-bold text-green-900">{stats.in_progress_count}</div>
                <div className="text-green-700 text-xs mt-1">人</div>
              </div>
            </div>

            {/* 予想待ち時間 */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl p-4 text-center mb-4">
              <div className="text-blue-800 text-sm font-semibold mb-1">予想待ち時間</div>
              <div className="text-5xl font-bold text-blue-900">
                {stats.estimated_wait_minutes}
              </div>
              <div className="text-blue-700 text-xs mt-1">分</div>
            </div>

            {/* 席の状況 */}
            {stats.seats && stats.seats.length > 0 && (
              <div className="space-y-3 mb-4">
                <h3 className="text-sm font-bold text-gray-900 mb-2">各席の状況</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
                  {stats.seats.map((seat) => {
                    const progress = (seat.remaining_minutes / 10) * 100;
                    return (
                      <div key={seat.seat_name} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-900">{seat.seat_name}</span>
                            <span className="text-sm text-gray-600">{seat.name}様</span>
                          </div>
                          <span className="text-sm font-semibold text-blue-600">
                            残り {Math.ceil(seat.remaining_minutes)}分
                          </span>
                        </div>
                        {/* プログレスバー */}
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 待機者リスト */}
            {waitingList.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-900 mb-2">待機中の方</h3>
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-3 gap-2">
                    {waitingList.map((reservation) => (
                      <div
                        key={reservation.queue_number}
                        className="bg-white rounded-lg p-2 border border-yellow-200 text-center"
                      >
                        <div className="text-2xl font-bold text-yellow-600">
                          {reservation.queue_number}
                        </div>
                        <div className="text-xs text-gray-700">
                          {reservation.name}様
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            </div>
          )}

          {/* 右側: 受付フォーム */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-green-600">
          {/* マインクラフトキャラクター */}
          <div className="flex justify-center mb-6">
            <div className="animate-pixel-pulse">
              <MinecraftCharacter />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 minecraft-text">
              マインクラフトで<br />プログラミング体験会
            </h1>
            <div className="flex justify-center gap-2 mb-2">
              <MinecraftDiamond className="w-6 h-6" />
              <MinecraftPickaxe className="w-8 h-8" />
              <MinecraftDiamond className="w-6 h-6" />
            </div>
            <p className="text-gray-600 font-semibold">
              受付フォーム
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                お名前
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900"
                placeholder="山田 太郎"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg transition disabled:bg-gray-400 disabled:cursor-not-allowed border-4 border-green-800 shadow-lg transform hover:scale-105 minecraft-text"
            >
              {loading ? '処理中...' : '🎮 受付する'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex justify-center gap-4 text-sm">
              <a
                href="/admin"
                className="text-blue-600 hover:text-blue-700 hover:underline"
              >
                管理画面
              </a>
            </div>
          </div>
          </div>
        </div>

        {/* ご案内セクション（下部に全幅で表示） */}
        <div className="mt-6 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg p-4 border-2 border-green-400">
          <h2 className="font-bold text-gray-900 mb-2 minecraft-text flex items-center gap-2">
            ⛏️ ご案内
          </h2>
          <ul className="text-sm text-gray-700 space-y-2">
            <li className="flex items-center gap-2">
              <span className="text-green-600">🟩</span>
              <span>体験時間: 約10分</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-600">🟦</span>
              <span>受付後、待ち番号をお伝えします</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-yellow-600">🟨</span>
              <span>待ち時間の目安を確認できます</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
