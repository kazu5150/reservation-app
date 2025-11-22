from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
import os
import math
import asyncio
from dotenv import load_dotenv
from supabase import create_client, Client

# 環境変数の読み込み
load_dotenv()

app = FastAPI(title="予約管理API")

# CORS設定（フロントエンドからのアクセスを許可）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.jsのデフォルトポート
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabaseクライアントの初期化
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

if not supabase_url or not supabase_key:
    raise ValueError("SUPABASE_URLとSUPABASE_KEYを.envファイルに設定してください")

supabase: Client = create_client(supabase_url, supabase_key)

# 体験時間の設定（分）
EXPERIENCE_DURATION_MINUTES = 10

# 同時に体験できる最大人数
MAX_CONCURRENT_EXPERIENCES = 3

# データモデル
class ReservationCreate(BaseModel):
    name: str

class ReservationUpdate(BaseModel):
    status: str

class Reservation(BaseModel):
    id: str
    queue_number: int
    name: str
    status: str
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

class WaitInfo(BaseModel):
    queue_number: int
    position: int  # 待ち順位（何番目か）
    estimated_wait_minutes: int  # 予想待ち時間（分）
    current_status: str

class Seat(BaseModel):
    seat_name: str  # 席名（A席、B席、C席）
    name: str  # 利用者名
    remaining_minutes: float  # 残り時間（分）
    queue_number: int  # 予約番号

class OvertimeSeat(BaseModel):
    seat_name: str  # 席名（A席、B席、C席）
    name: str  # 利用者名
    overtime_minutes: float  # 超過時間（分）

class Stats(BaseModel):
    waiting_count: int  # 待機中の人数
    in_progress_count: int  # 体験中の人数
    completed_count: int  # 完了した人数
    estimated_wait_minutes: int  # 現在の予想待ち時間（分）
    seats: List[Seat]  # 各席の情報
    overtime_seats: List[OvertimeSeat]  # 超過している席の情報

# バックグラウンドタスク用の変数
background_task: Optional[asyncio.Task] = None

# 自動完了チェック関数
async def auto_complete_expired_sessions():
    """
    定期的に体験中のセッションをチェックし、
    10分経過したものを自動的に完了にする
    """
    while True:
        try:
            # 体験中の予約を取得
            in_progress_response = supabase.table("reservations").select("*").eq("status", "in_progress").execute()

            if in_progress_response.data:
                now = datetime.now(timezone.utc)

                for reservation in in_progress_response.data:
                    if reservation.get("started_at"):
                        try:
                            started_at_str = reservation["started_at"]
                            if started_at_str.endswith('Z'):
                                started_at_str = started_at_str[:-1] + '+00:00'
                            started_at = datetime.fromisoformat(started_at_str)

                            # 経過時間（分）を計算
                            elapsed_minutes = (now - started_at).total_seconds() / 60

                            # 10分以上経過していたら自動完了
                            if elapsed_minutes >= EXPERIENCE_DURATION_MINUTES:
                                supabase.table("reservations").update({
                                    "status": "completed",
                                    "completed_at": now.isoformat()
                                }).eq("queue_number", reservation["queue_number"]).execute()

                                print(f"自動完了: 予約番号 {reservation['queue_number']} ({reservation['name']}様) - 経過時間: {elapsed_minutes:.1f}分")
                        except Exception as e:
                            print(f"予約番号 {reservation.get('queue_number')} の処理中にエラー: {e}")

            # 30秒ごとにチェック
            await asyncio.sleep(30)

        except Exception as e:
            print(f"自動完了チェック中にエラー: {e}")
            await asyncio.sleep(30)

# 起動時にバックグラウンドタスクを開始
@app.on_event("startup")
async def startup_event():
    global background_task
    background_task = asyncio.create_task(auto_complete_expired_sessions())
    print("自動完了バックグラウンドタスクを開始しました")

# シャットダウン時にバックグラウンドタスクを停止
@app.on_event("shutdown")
async def shutdown_event():
    global background_task
    if background_task:
        background_task.cancel()
        try:
            await background_task
        except asyncio.CancelledError:
            pass
        print("自動完了バックグラウンドタスクを停止しました")

# ルートエンドポイント
@app.get("/")
def read_root():
    return {"message": "予約管理APIへようこそ"}

# 新規予約作成
@app.post("/reservations", response_model=Reservation)
async def create_reservation(reservation: ReservationCreate):
    """
    新規予約を作成
    """
    try:
        response = supabase.table("reservations").insert({
            "name": reservation.name,
            "status": "waiting"
        }).execute()

        if not response.data:
            raise HTTPException(status_code=500, detail="予約の作成に失敗しました")

        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 全予約取得（管理者用）
@app.get("/reservations", response_model=List[Reservation])
async def get_all_reservations():
    """
    全予約を取得（管理者画面用）
    """
    try:
        response = supabase.table("reservations").select("*").order("queue_number").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 待ち状況取得
@app.get("/reservations/{queue_number}/wait-info", response_model=WaitInfo)
async def get_wait_info(queue_number: int):
    """
    待ち番号から待ち状況を取得
    """
    try:
        # 指定された番号の予約を取得
        reservation_response = supabase.table("reservations").select("*").eq("queue_number", queue_number).execute()

        if not reservation_response.data:
            raise HTTPException(status_code=404, detail="予約が見つかりません")

        reservation = reservation_response.data[0]

        # 自分より前の待機中の人数を計算
        waiting_before = supabase.table("reservations").select("*").lt("queue_number", queue_number).eq("status", "waiting").order("queue_number").execute()
        waiting_before_count = len(waiting_before.data) if waiting_before.data else 0

        # 現在体験中の予約を取得
        in_progress_response = supabase.table("reservations").select("*").eq("status", "in_progress").execute()
        in_progress_count = len(in_progress_response.data) if in_progress_response.data else 0

        # 自分の順位（待機中の中での順位）
        position = waiting_before_count + 1

        # 予想待ち時間を計算（体験開始時刻を考慮）
        now = datetime.now(timezone.utc)

        # 体験中の各予約の残り時間を計算
        slot_available_times = []  # 各枠が空くまでの時間（分）

        for res in (in_progress_response.data or []):
            if res.get("started_at"):
                try:
                    started_at_str = res["started_at"]
                    if started_at_str.endswith('Z'):
                        started_at_str = started_at_str[:-1] + '+00:00'
                    started_at = datetime.fromisoformat(started_at_str)
                    # 経過時間（分）
                    elapsed_minutes = (now - started_at).total_seconds() / 60
                    # 残り時間（分）
                    remaining_minutes = max(0, EXPERIENCE_DURATION_MINUTES - elapsed_minutes)
                    slot_available_times.append(remaining_minutes)
                except Exception:
                    # パースエラーの場合は残り時間を最大値とする
                    slot_available_times.append(EXPERIENCE_DURATION_MINUTES)

        # 残り時間でソート（早く空く順）
        slot_available_times.sort()

        # 利用可能な枠の数
        available_slots = MAX_CONCURRENT_EXPERIENCES - in_progress_count

        # すぐに使える枠を追加
        for _ in range(available_slots):
            slot_available_times.insert(0, 0)

        # 自分より前の人数 + 自分自身を割り当て
        total_people = waiting_before_count + 1

        if total_people == 0:
            estimated_wait_minutes = 0
        else:
            # タイムラインを作成（最初の3枠）
            timeline = slot_available_times[:MAX_CONCURRENT_EXPERIENCES].copy()
            # timeline が MAX_CONCURRENT_EXPERIENCES より少ない場合は0で埋める
            while len(timeline) < MAX_CONCURRENT_EXPERIENCES:
                timeline.append(0)

            for i in range(total_people):
                # 一番早く空く枠を使用
                earliest_available = min(timeline)
                # この人の待ち時間
                wait_time = earliest_available

                # 自分の番の場合、待ち時間を記録
                if i == total_people - 1:
                    estimated_wait_minutes = int(math.ceil(wait_time))

                # この枠が次に空く時刻を更新
                timeline.remove(earliest_available)
                timeline.append(earliest_available + EXPERIENCE_DURATION_MINUTES)

        return WaitInfo(
            queue_number=queue_number,
            position=position,
            estimated_wait_minutes=estimated_wait_minutes,
            current_status=reservation["status"]
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 予約ステータス更新（管理者用）
@app.patch("/reservations/{queue_number}", response_model=Reservation)
async def update_reservation_status(queue_number: int, update: ReservationUpdate):
    """
    予約のステータスを更新（管理者画面用）
    """
    try:
        # ステータスを "in_progress" に変更する場合、同時体験人数の上限をチェック
        if update.status == "in_progress":
            # 現在体験中の人数を取得
            in_progress_response = supabase.table("reservations").select("*", count="exact").eq("status", "in_progress").execute()
            current_in_progress = in_progress_response.count if in_progress_response.count is not None else 0

            # 上限チェック
            if current_in_progress >= MAX_CONCURRENT_EXPERIENCES:
                raise HTTPException(
                    status_code=400,
                    detail=f"同時に体験できる人数は{MAX_CONCURRENT_EXPERIENCES}人までです。現在{current_in_progress}人が体験中です。"
                )

        update_data = {"status": update.status}

        # ステータスに応じてタイムスタンプを更新（UTC で保存）
        if update.status == "in_progress":
            update_data["started_at"] = datetime.now(timezone.utc).isoformat()
        elif update.status in ["completed", "cancelled"]:
            update_data["completed_at"] = datetime.now(timezone.utc).isoformat()

        response = supabase.table("reservations").update(update_data).eq("queue_number", queue_number).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="予約が見つかりません")

        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 待機中の予約一覧取得
@app.get("/reservations/waiting/list", response_model=List[Reservation])
async def get_waiting_reservations():
    """
    待機中の予約一覧を取得
    """
    try:
        response = supabase.table("reservations").select("*").eq("status", "waiting").order("queue_number").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 統計情報取得
@app.get("/stats", response_model=Stats)
async def get_stats():
    """
    現在の待機状況の統計情報を取得
    """
    try:
        # 各ステータスの件数を取得
        waiting_response = supabase.table("reservations").select("*").eq("status", "waiting").order("queue_number").execute()
        in_progress_response = supabase.table("reservations").select("*").eq("status", "in_progress").execute()
        completed_response = supabase.table("reservations").select("*", count="exact").eq("status", "completed").execute()

        waiting_count = len(waiting_response.data) if waiting_response.data else 0
        in_progress_count = len(in_progress_response.data) if in_progress_response.data else 0
        completed_count = completed_response.count if completed_response.count is not None else 0

        # 現在の予想待ち時間を計算（体験開始時刻を考慮）
        now = datetime.now(timezone.utc)

        # 体験中の各予約の残り時間を計算
        slot_available_times = []  # 各枠が空くまでの時間（分）
        seats_info = []  # 各席の情報
        overtime_seats_info = []  # 超過している席の情報
        seat_names = ["A席", "B席", "C席"]

        for idx, reservation in enumerate(in_progress_response.data or []):
            remaining_minutes = EXPERIENCE_DURATION_MINUTES
            elapsed_minutes = 0
            if reservation.get("started_at"):
                try:
                    started_at_str = reservation["started_at"]
                    if started_at_str.endswith('Z'):
                        started_at_str = started_at_str[:-1] + '+00:00'
                    started_at = datetime.fromisoformat(started_at_str)
                    # 経過時間（分）
                    elapsed_minutes = (now - started_at).total_seconds() / 60
                    # 残り時間（分）
                    remaining_minutes = max(0, EXPERIENCE_DURATION_MINUTES - elapsed_minutes)
                except Exception:
                    # パースエラーの場合は残り時間を最大値とする
                    remaining_minutes = EXPERIENCE_DURATION_MINUTES

            slot_available_times.append(remaining_minutes)

            # 席の情報を追加
            if idx < len(seat_names):
                # 10分を超過しているかチェック
                if elapsed_minutes > EXPERIENCE_DURATION_MINUTES:
                    overtime_minutes = elapsed_minutes - EXPERIENCE_DURATION_MINUTES
                    overtime_seats_info.append(OvertimeSeat(
                        seat_name=seat_names[idx],
                        name=reservation.get("name", "Unknown"),
                        overtime_minutes=round(overtime_minutes, 1)
                    ))
                else:
                    seats_info.append(Seat(
                        seat_name=seat_names[idx],
                        name=reservation.get("name", "Unknown"),
                        remaining_minutes=round(remaining_minutes, 1),
                        queue_number=reservation.get("queue_number", 0)
                    ))

        # 残り時間でソート（早く空く順）
        slot_available_times.sort()

        # 利用可能な枠の数
        available_slots = MAX_CONCURRENT_EXPERIENCES - in_progress_count

        # すぐに使える枠を追加
        for _ in range(available_slots):
            slot_available_times.insert(0, 0)

        # 待機中の人を順番に割り当てて、最後の人（または今登録する人）の待ち時間を計算
        # タイムラインを作成
        timeline = slot_available_times[:MAX_CONCURRENT_EXPERIENCES].copy()
        while len(timeline) < MAX_CONCURRENT_EXPERIENCES:
            timeline.append(0)

        if waiting_count == 0:
            # 待機中の人がいない場合、今登録する人の待ち時間
            # = 次に空く枠までの時間
            estimated_wait_minutes = int(math.ceil(min(timeline)))
        else:
            # 待機中の人がいる場合、最後の人の待ち時間を計算
            for i in range(waiting_count):
                # 一番早く空く枠を使用
                earliest_available = min(timeline)
                # この人の待ち時間
                wait_time = earliest_available
                # この枠が次に空く時刻を更新
                timeline.remove(earliest_available)
                timeline.append(earliest_available + EXPERIENCE_DURATION_MINUTES)

                # 最後の人の待ち時間を記録
                if i == waiting_count - 1:
                    estimated_wait_minutes = int(math.ceil(wait_time))

        return Stats(
            waiting_count=waiting_count,
            in_progress_count=in_progress_count,
            completed_count=completed_count,
            estimated_wait_minutes=estimated_wait_minutes,
            seats=seats_info,
            overtime_seats=overtime_seats_info
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
