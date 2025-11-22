'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { WaitInfo } from '@/types/reservation';

export default function WaitPage() {
  const params = useParams();
  const router = useRouter();
  const queueNumber = params.queue_number as string;

  const [waitInfo, setWaitInfo] = useState<WaitInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchWaitInfo = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/reservations/${queueNumber}/wait-info`
      );

      if (!response.ok) {
        if (response.status === 404) {
          setError('予約が見つかりません');
        } else {
          setError('情報の取得に失敗しました');
        }
        setLoading(false);
        return;
      }

      const data = await response.json();
      setWaitInfo(data);
      setLoading(false);
    } catch (err) {
      setError('情報の取得に失敗しました');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWaitInfo();

    // 30秒ごとに自動更新
    const interval = setInterval(fetchWaitInfo, 30000);

    return () => clearInterval(interval);
  }, [queueNumber]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <p className="mt-4 text-slate-600 font-semibold text-xl">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border-2 border-red-200 p-10 max-w-md w-full">
          <div className="text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-3">エラー</h1>
            <p className="text-slate-600 mb-8 text-lg">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg transition shadow-sm text-xl"
            >
              トップページに戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'お待ちください';
      case 'in_progress':
        return '体験中';
      case 'completed':
        return '完了しました';
      case 'cancelled':
        return 'キャンセルされました';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'in_progress':
        return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border border-red-200';
      default:
        return 'bg-slate-100 text-slate-800 border border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="bg-white rounded-xl shadow-sm border-2 border-slate-200 p-10">
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-3">
              受付完了
            </h1>
            <p className="text-slate-600 text-xl">
              以下の番号でお待ちください
            </p>
          </div>

          {waitInfo && (
            <>
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-10 mb-8">
                <div className="text-center">
                  <div className="text-lg text-slate-600 mb-3 font-semibold">あなたの番号</div>
                  <div className="text-8xl font-bold text-blue-600 mb-6">
                    {waitInfo.queue_number}
                  </div>
                  <div className={`inline-block px-5 py-3 rounded-lg text-lg font-bold border-2 ${getStatusColor(waitInfo.current_status)}`}>
                    {getStatusText(waitInfo.current_status)}
                  </div>

                  {/* 待ち時間を番号カード内に表示 */}
                  {waitInfo.current_status === 'waiting' && (
                    <div className="mt-8 pt-8 border-t-2 border-blue-200">
                      <div className="text-lg text-slate-600 mb-3 font-semibold">予想待ち時間</div>
                      <div className="text-7xl font-bold text-blue-600 mb-2">
                        約{waitInfo.estimated_wait_minutes}
                      </div>
                      <div className="text-xl text-slate-600 font-semibold">分</div>
                      <div className="text-base text-slate-500 mt-3">
                        （待ち人数: {waitInfo.position - 1}人）
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {waitInfo.current_status === 'in_progress' && (
                <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-6 mb-8 text-center">
                  <p className="text-emerald-800 font-bold text-xl">
                    まもなくあなたの番です
                  </p>
                  <p className="text-emerald-700 text-lg mt-2">
                    スタッフの指示に従ってください
                  </p>
                </div>
              )}

              {waitInfo.current_status === 'completed' && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-8 text-center">
                  <p className="text-blue-800 font-bold text-xl">
                    体験ありがとうございました
                  </p>
                </div>
              )}

              <div className="text-center text-sm text-slate-500 mb-8 font-medium">
                30秒ごとに自動更新されます
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={fetchWaitInfo}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg transition shadow-sm text-lg"
                >
                  手動で更新
                </button>

                <button
                  onClick={() => router.push('/')}
                  className="w-full bg-slate-600 hover:bg-slate-700 text-white font-bold py-4 px-6 rounded-lg transition shadow-sm text-lg"
                >
                  トップページに戻る
                </button>
              </div>
            </>
          )}
        </div>

        <div className="mt-8 bg-slate-50 border-2 border-slate-200 rounded-xl p-6">
          <h2 className="font-bold text-slate-900 mb-4 text-lg">
            注意事項
          </h2>
          <ul className="text-base text-slate-600 space-y-3">
            <li className="flex items-center gap-3">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>この画面を閉じても順番は保持されます</span>
            </li>
            <li className="flex items-center gap-3">
              <svg className="w-6 h-6 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>番号が呼ばれたら受付へお越しください</span>
            </li>
            <li className="flex items-center gap-3">
              <svg className="w-6 h-6 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>不明な点はスタッフにお尋ねください</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
