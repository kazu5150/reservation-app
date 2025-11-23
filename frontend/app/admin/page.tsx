'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Reservation, ReservationWithWaitTime } from '@/types/reservation';

export default function AdminPage() {
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [waitingWithTimes, setWaitingWithTimes] = useState<ReservationWithWaitTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReservations = async () => {
    try {
      const [reservationsResponse, waitingTimesResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/reservations`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/reservations/waiting/with-wait-times`)
      ]);

      if (!reservationsResponse.ok) {
        throw new Error('予約情報の取得に失敗しました');
      }

      const data = await reservationsResponse.json();
      // 降順（新しい順）にソート
      const sortedData = data.sort((a: Reservation, b: Reservation) => b.queue_number - a.queue_number);
      setReservations(sortedData);

      // 待機中の予約の待ち時間情報を取得
      if (waitingTimesResponse.ok) {
        const waitingData = await waitingTimesResponse.json();
        setWaitingWithTimes(waitingData);
      }

      setLoading(false);
    } catch (err) {
      setError('予約情報の取得に失敗しました');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();

    // 10秒ごとに自動更新
    const interval = setInterval(fetchReservations, 10000);

    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (queueNumber: number, newStatus: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/reservations/${queueNumber}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        throw new Error('ステータスの更新に失敗しました');
      }

      // 更新後に再取得
      fetchReservations();
    } catch (err) {
      alert('ステータスの更新に失敗しました');
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'in_progress':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'waiting':
        return '待機中';
      case 'in_progress':
        return '体験中';
      case 'completed':
        return '完了';
      case 'cancelled':
        return 'キャンセル';
      default:
        return status;
    }
  };

  const waitingCount = reservations.filter((r) => r.status === 'waiting').length;
  const inProgressCount = reservations.filter((r) => r.status === 'in_progress').length;
  const completedCount = reservations.filter((r) => r.status === 'completed').length;

  // 待機中の予約一覧（待ち時間付き）を使用
  const waitingReservations = waitingWithTimes;

  // 空いている席の数を計算
  const MAX_CONCURRENT = 3;
  const availableSeats = MAX_CONCURRENT - inProgressCount;

  // 次に案内すべき予約（空いている席の数だけ）
  const nextToCall = waitingReservations.slice(0, Math.max(0, availableSeats));

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="mt-4 text-slate-600 font-medium">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-slate-900">
              管理画面
            </h1>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition shadow-sm text-lg"
            >
              トップページ
            </button>
          </div>

          {/* 統計情報 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6 text-center">
              <div className="text-amber-700 text-base font-semibold mb-3">待機中</div>
              <div className="text-6xl font-bold text-amber-900">{waitingCount}</div>
              <div className="text-amber-600 text-base mt-2">人</div>
            </div>
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-6 text-center">
              <div className="text-emerald-700 text-base font-semibold mb-3">体験中</div>
              <div className="text-6xl font-bold text-emerald-900">{inProgressCount}</div>
              <div className="text-emerald-600 text-base mt-2">人</div>
            </div>
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 text-center">
              <div className="text-blue-700 text-base font-semibold mb-3">完了</div>
              <div className="text-6xl font-bold text-blue-900">{completedCount}</div>
              <div className="text-blue-600 text-base mt-2">人</div>
            </div>
          </div>
        </div>

        {/* 次の案内対象者 */}
        {availableSeats > 0 && nextToCall.length > 0 && (
          <div className="bg-orange-50 rounded-xl shadow-sm border-2 border-orange-200 p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-2xl font-bold text-slate-900">
                次の案内
              </h2>
              <span className="bg-orange-500 text-white px-3 py-2 rounded-full text-base font-bold">
                {availableSeats}席空き
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {nextToCall.map((reservation) => (
                <div
                  key={reservation.id}
                  className="bg-white rounded-xl p-5 border-2 border-orange-300 shadow-sm"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="text-4xl font-bold text-orange-600 mb-2">
                        {reservation.queue_number}
                      </div>
                      <div className="text-xl font-bold text-slate-900">
                        {reservation.name}様
                      </div>
                    </div>
                    <div className="bg-amber-100 px-3 py-2 rounded text-base font-bold text-amber-800 border-2 border-amber-200">
                      待機中
                    </div>
                  </div>

                  <button
                    onClick={() => updateStatus(reservation.queue_number, 'in_progress')}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-lg transition shadow-sm text-lg"
                  >
                    案内開始
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 待機中の方一覧 */}
        {waitingReservations.length > 0 && (
          <div className="bg-amber-50 rounded-xl shadow-sm border-2 border-amber-200 p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-2xl font-bold text-slate-900">
                待機中の方
              </h2>
              <span className="bg-amber-500 text-white px-3 py-2 rounded-full text-base font-bold">
                {waitingReservations.length}人
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {waitingReservations.map((reservation, index) => (
                <div
                  key={reservation.id}
                  className={`bg-white rounded-xl p-4 border-2 shadow-sm ${
                    index < availableSeats
                      ? 'border-orange-300 bg-orange-50'
                      : 'border-amber-200'
                  }`}
                >
                  <div className="text-center">
                    <div className={`text-3xl font-bold mb-2 ${
                      index < availableSeats ? 'text-orange-600' : 'text-amber-600'
                    }`}>
                      {reservation.queue_number}
                    </div>
                    <div className="text-base font-bold text-slate-900">
                      {reservation.name}様
                    </div>
                    <div className="text-sm text-slate-500 mt-2">
                      {new Date(reservation.created_at).toLocaleTimeString('ja-JP', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    {/* 待ち時間表示 */}
                    <div className={`mt-2 text-lg font-bold ${
                      reservation.estimated_wait_minutes === 0
                        ? 'text-green-600'
                        : 'text-blue-600'
                    }`}>
                      {reservation.estimated_wait_minutes === 0
                        ? 'すぐ案内可能'
                        : `約${reservation.estimated_wait_minutes}分待ち`
                      }
                    </div>
                    {index < availableSeats && (
                      <div className="mt-1 text-sm font-bold text-orange-600">
                        次の案内
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* エラー表示 */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6 text-red-700 text-base font-medium">
            {error}
          </div>
        )}

        {/* 予約一覧 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border-2 border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-900">予約一覧</h2>
              <button
                onClick={fetchReservations}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-5 rounded-lg transition text-base shadow-sm"
              >
                更新
              </button>
            </div>
            <p className="text-sm text-slate-500 mt-2">
              10秒ごとに自動更新されます
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-600 uppercase tracking-wider">
                    番号
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-600 uppercase tracking-wider">
                    名前
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-600 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-600 uppercase tracking-wider">
                    受付時刻
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-600 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {reservations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-500 text-lg">
                      予約がありません
                    </td>
                  </tr>
                ) : (
                  reservations.map((reservation) => (
                    <tr key={reservation.id} className="hover:bg-slate-50">
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="text-2xl font-bold text-slate-900">
                          {reservation.queue_number}
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="text-lg font-semibold text-slate-900">
                          {reservation.name}
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className={`px-3 py-2 inline-flex text-sm leading-5 font-bold rounded border-2 ${getStatusBadgeColor(reservation.status)}`}>
                          {getStatusText(reservation.status)}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-base text-slate-500">
                        {new Date(reservation.created_at).toLocaleString('ja-JP')}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-base font-medium">
                        <div className="flex flex-wrap gap-2">
                          {reservation.status === 'waiting' && (
                            <button
                              onClick={() => updateStatus(reservation.queue_number, 'in_progress')}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition font-bold text-sm"
                            >
                              開始
                            </button>
                          )}
                          {reservation.status === 'in_progress' && (
                            <button
                              onClick={() => updateStatus(reservation.queue_number, 'completed')}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition font-bold text-sm"
                            >
                              完了
                            </button>
                          )}
                          {(reservation.status === 'waiting' || reservation.status === 'in_progress') && (
                            <button
                              onClick={() => updateStatus(reservation.queue_number, 'cancelled')}
                              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition font-bold text-sm"
                            >
                              キャンセル
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
