from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import os
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

class Stats(BaseModel):
    waiting_count: int  # 待機中の人数
    in_progress_count: int  # 体験中の人数
    completed_count: int  # 完了した人数
    estimated_wait_minutes: int  # 現在の予想待ち時間（分）

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

        # 自分より前の待ち人数を計算
        waiting_before = supabase.table("reservations").select("*", count="exact").lt("queue_number", queue_number).in_("status", ["waiting", "in_progress"]).execute()

        position = waiting_before.count + 1 if waiting_before.count is not None else 1

        # 予想待ち時間を計算（前の人数 × 体験時間）
        estimated_wait_minutes = max(0, (position - 1) * EXPERIENCE_DURATION_MINUTES)

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
        update_data = {"status": update.status}

        # ステータスに応じてタイムスタンプを更新
        if update.status == "in_progress":
            update_data["started_at"] = datetime.now().isoformat()
        elif update.status in ["completed", "cancelled"]:
            update_data["completed_at"] = datetime.now().isoformat()

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
        waiting_response = supabase.table("reservations").select("*", count="exact").eq("status", "waiting").execute()
        in_progress_response = supabase.table("reservations").select("*", count="exact").eq("status", "in_progress").execute()
        completed_response = supabase.table("reservations").select("*", count="exact").eq("status", "completed").execute()

        waiting_count = waiting_response.count if waiting_response.count is not None else 0
        in_progress_count = in_progress_response.count if in_progress_response.count is not None else 0
        completed_count = completed_response.count if completed_response.count is not None else 0

        # 現在の予想待ち時間を計算（待機中 + 体験中の人数 × 体験時間）
        total_waiting = waiting_count + in_progress_count
        estimated_wait_minutes = total_waiting * EXPERIENCE_DURATION_MINUTES

        return Stats(
            waiting_count=waiting_count,
            in_progress_count=in_progress_count,
            completed_count=completed_count,
            estimated_wait_minutes=estimated_wait_minutes
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
