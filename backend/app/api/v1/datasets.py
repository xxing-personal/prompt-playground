from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from uuid import UUID
import json

from app.core.database import get_db
from app.models import UseCase, Dataset, DatasetItem
from app.schemas import (
    DatasetCreate, DatasetUpdate, DatasetResponse, DatasetWithStats,
    DatasetItemCreate, DatasetItemUpdate, DatasetItemResponse, DatasetItemBatchCreate,
    PaginatedResponse
)

router = APIRouter(tags=["datasets"])


# === Dataset CRUD ===

@router.get("/use-cases/{use_case_id}/datasets", response_model=PaginatedResponse[DatasetResponse])
async def list_datasets(
    use_case_id: UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db)
):
    use_case = await db.get(UseCase, use_case_id)
    if not use_case:
        raise HTTPException(status_code=404, detail="Use case not found")

    base_query = select(Dataset).where(Dataset.use_case_id == use_case_id)
    count_query = select(func.count()).select_from(base_query.subquery())
    total = (await db.execute(count_query)).scalar() or 0

    query = base_query.offset((page - 1) * limit).limit(limit).order_by(Dataset.created_at.desc())
    result = await db.execute(query)
    items = result.scalars().all()

    return PaginatedResponse(
        items=[DatasetResponse.model_validate(d) for d in items],
        total=total,
        page=page,
        limit=limit,
        pages=(total + limit - 1) // limit
    )


@router.post("/use-cases/{use_case_id}/datasets", response_model=DatasetResponse, status_code=201)
async def create_dataset(
    use_case_id: UUID,
    data: DatasetCreate,
    db: AsyncSession = Depends(get_db)
):
    use_case = await db.get(UseCase, use_case_id)
    if not use_case:
        raise HTTPException(status_code=404, detail="Use case not found")

    # Convert assertions to dict format
    assertions_list = [a.model_dump() for a in data.default_assertions] if data.default_assertions else []
    
    dataset = Dataset(
        use_case_id=use_case_id,
        name=data.name,
        description=data.description,
        input_schema=data.input_schema,
        expected_output_schema=data.expected_output_schema,
        default_assertions=assertions_list,
    )
    db.add(dataset)
    await db.commit()
    await db.refresh(dataset)
    return DatasetResponse.model_validate(dataset)


@router.get("/datasets/{dataset_id}", response_model=DatasetWithStats)
async def get_dataset(dataset_id: UUID, db: AsyncSession = Depends(get_db)):
    dataset = await db.get(Dataset, dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    item_count = (await db.execute(
        select(func.count(DatasetItem.id)).where(DatasetItem.dataset_id == dataset_id)
    )).scalar() or 0

    response = DatasetWithStats.model_validate(dataset)
    response.item_count = item_count
    return response


@router.patch("/datasets/{dataset_id}", response_model=DatasetResponse)
async def update_dataset(
    dataset_id: UUID,
    data: DatasetUpdate,
    db: AsyncSession = Depends(get_db)
):
    dataset = await db.get(Dataset, dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    update_data = data.model_dump(exclude_unset=True)
    if "default_assertions" in update_data and update_data["default_assertions"]:
        update_data["default_assertions"] = [a.model_dump() if hasattr(a, 'model_dump') else a for a in update_data["default_assertions"]]
    
    for key, value in update_data.items():
        setattr(dataset, key, value)

    await db.commit()
    await db.refresh(dataset)
    return DatasetResponse.model_validate(dataset)


@router.delete("/datasets/{dataset_id}", status_code=204)
async def delete_dataset(dataset_id: UUID, db: AsyncSession = Depends(get_db)):
    dataset = await db.get(Dataset, dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    await db.delete(dataset)
    await db.commit()


# === Dataset Items ===

@router.get("/datasets/{dataset_id}/items", response_model=PaginatedResponse[DatasetItemResponse])
async def list_dataset_items(
    dataset_id: UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db)
):
    dataset = await db.get(Dataset, dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    base_query = select(DatasetItem).where(DatasetItem.dataset_id == dataset_id)
    count_query = select(func.count()).select_from(base_query.subquery())
    total = (await db.execute(count_query)).scalar() or 0

    query = base_query.offset((page - 1) * limit).limit(limit).order_by(DatasetItem.created_at.desc())
    result = await db.execute(query)
    items = result.scalars().all()

    return PaginatedResponse(
        items=[DatasetItemResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        limit=limit,
        pages=(total + limit - 1) // limit
    )


@router.post("/datasets/{dataset_id}/items", response_model=DatasetItemResponse, status_code=201)
async def create_dataset_item(
    dataset_id: UUID,
    data: DatasetItemCreate,
    db: AsyncSession = Depends(get_db)
):
    dataset = await db.get(Dataset, dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    item = DatasetItem(
        dataset_id=dataset_id,
        input=data.input,
        expected_output=data.expected_output,
        item_metadata=data.item_metadata,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return DatasetItemResponse.model_validate(item)


@router.post("/datasets/{dataset_id}/items/batch", response_model=dict, status_code=201)
async def batch_create_items(
    dataset_id: UUID,
    data: DatasetItemBatchCreate,
    db: AsyncSession = Depends(get_db)
):
    dataset = await db.get(Dataset, dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    created = 0
    for item_data in data.items:
        item = DatasetItem(
            dataset_id=dataset_id,
            input=item_data.input,
            expected_output=item_data.expected_output,
            item_metadata=item_data.item_metadata,
        )
        db.add(item)
        created += 1

    await db.commit()
    return {"created": created}


@router.post("/datasets/{dataset_id}/items/import", response_model=dict, status_code=201)
async def import_items_from_json(
    dataset_id: UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    dataset = await db.get(Dataset, dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    try:
        content = await file.read()
        items_data = json.loads(content)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON file")

    if not isinstance(items_data, list):
        raise HTTPException(status_code=400, detail="JSON must be an array of items")

    created = 0
    for item_data in items_data:
        if not isinstance(item_data, dict):
            continue
        
        item = DatasetItem(
            dataset_id=dataset_id,
            input=item_data.get("input", item_data),
            expected_output=item_data.get("expected_output"),
            item_metadata=item_data.get("metadata", {}),
        )
        db.add(item)
        created += 1

    await db.commit()
    return {"created": created}


@router.get("/datasets/{dataset_id}/items/{item_id}", response_model=DatasetItemResponse)
async def get_dataset_item(
    dataset_id: UUID,
    item_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    item = await db.get(DatasetItem, item_id)
    if not item or item.dataset_id != dataset_id:
        raise HTTPException(status_code=404, detail="Item not found")
    return DatasetItemResponse.model_validate(item)


@router.patch("/datasets/{dataset_id}/items/{item_id}", response_model=DatasetItemResponse)
async def update_dataset_item(
    dataset_id: UUID,
    item_id: UUID,
    data: DatasetItemUpdate,
    db: AsyncSession = Depends(get_db)
):
    item = await db.get(DatasetItem, item_id)
    if not item or item.dataset_id != dataset_id:
        raise HTTPException(status_code=404, detail="Item not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(item, key, value)

    await db.commit()
    await db.refresh(item)
    return DatasetItemResponse.model_validate(item)


@router.delete("/datasets/{dataset_id}/items/{item_id}", status_code=204)
async def delete_dataset_item(
    dataset_id: UUID,
    item_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    item = await db.get(DatasetItem, item_id)
    if not item or item.dataset_id != dataset_id:
        raise HTTPException(status_code=404, detail="Item not found")

    await db.delete(item)
    await db.commit()
