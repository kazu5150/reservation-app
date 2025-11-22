'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { WaitInfo } from '@/types/reservation';
import {
  MinecraftCharacter,
  MinecraftGrassBlock,
  MinecraftDiamond,
  FloatingBlocks
} from '@/components/MinecraftDecorations';

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
      <div className="min-h-screen bg-gradient-to-b from-green-100 via-blue-50 to-blue-100 flex items-center justify-center p-4 relative overflow-hidden">
        <FloatingBlocks />
        <div className="text-center relative z-10">
          <div className="animate-pixel-pulse mb-4">
            <MinecraftCharacter />
          </div>
          <p className="mt-4 text-gray-900 font-bold minecraft-text">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-100 via-blue-50 to-blue-100 flex items-center justify-center p-4 relative overflow-hidden">
        <FloatingBlocks />
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full border-4 border-red-600 relative z-10">
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2 minecraft-text">エラー</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition border-4 border-green-800 minecraft-text"
            >
              🏠 トップページに戻る
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
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-100 via-blue-50 to-blue-100 flex items-center justify-center p-4 relative overflow-hidden">
      <FloatingBlocks />

      {/* 地面のブロック */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-2 pb-4">
        <MinecraftGrassBlock />
        <MinecraftGrassBlock />
        <MinecraftGrassBlock />
        <MinecraftGrassBlock />
        <MinecraftGrassBlock />
      </div>

      <div className="max-w-4xl w-full relative z-10">
        <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-green-600">
          {/* マインクラフトキャラクター */}
          <div className="flex justify-center mb-6">
            <div className="animate-pixel-pulse">
              <MinecraftCharacter />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2 minecraft-text">
              ✅ 受付完了
            </h1>
            <div className="flex justify-center gap-2 mb-2">
              <MinecraftDiamond className="w-6 h-6" />
              <MinecraftDiamond className="w-6 h-6" />
            </div>
            <p className="text-gray-600 font-semibold">
              以下の番号でお待ちください
            </p>
          </div>

          {waitInfo && (
            <>
              <div className="bg-blue-50 rounded-xl p-8 mb-6">
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-2">あなたの番号</div>
                  <div className="text-6xl font-bold text-blue-600 mb-4">
                    {waitInfo.queue_number}
                  </div>
                  <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(waitInfo.current_status)}`}>
                    {getStatusText(waitInfo.current_status)}
                  </div>

                  {/* 待ち時間を番号カード内に表示 */}
                  {waitInfo.current_status === 'waiting' && (
                    <div className="mt-6 pt-6 border-t-2 border-blue-200">
                      <div className="text-sm text-gray-600 mb-2">予想待ち時間</div>
                      <div className="text-5xl font-bold text-blue-600 mb-1">
                        約{waitInfo.estimated_wait_minutes}
                      </div>
                      <div className="text-sm text-gray-600">分</div>
                      <div className="text-xs text-gray-500 mt-2">
                        （待ち人数: {waitInfo.position - 1}人）
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {waitInfo.current_status === 'in_progress' && (
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6 text-center">
                  <p className="text-green-800 font-semibold text-lg">
                    まもなくあなたの番です
                  </p>
                  <p className="text-green-700 mt-2">
                    スタッフの指示に従ってください
                  </p>
                </div>
              )}

              {waitInfo.current_status === 'completed' && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6 text-center">
                  <p className="text-blue-800 font-semibold text-lg">
                    体験ありがとうございました
                  </p>
                </div>
              )}

              <div className="text-center text-sm text-gray-500 mb-6">
                30秒ごとに自動更新されます
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={fetchWaitInfo}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition border-4 border-blue-800 minecraft-text transform hover:scale-105"
                >
                  🔄 手動で更新
                </button>

                <button
                  onClick={() => router.push('/')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition border-4 border-green-800 minecraft-text transform hover:scale-105"
                >
                  🏠 トップページに戻る
                </button>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg p-4 border-2 border-green-400">
          <h2 className="font-bold text-gray-900 mb-2 minecraft-text flex items-center gap-2">
            📋 注意事項
          </h2>
          <ul className="text-sm text-gray-700 space-y-2">
            <li className="flex items-center gap-2">
              <span className="text-green-600">🟩</span>
              <span>この画面を閉じても順番は保持されます</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-600">🟦</span>
              <span>番号が呼ばれたら受付へお越しください</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-yellow-600">🟨</span>
              <span>不明な点はスタッフにお尋ねください</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
