# FLOW ANALYSIS - Socket Progress Issues

## 🎯 FULL FLOW TRACE

### **Frontend Stages (page.tsx)**
```javascript
const STAGES = [
  { id: 1, name: 'Initializing' },           // ❌ KHÔNG CÓ SOCKET EMIT
  { id: 2, name: 'Encrypting & Storing' },   // ❌ KHÔNG CÓ SOCKET EMIT
  { id: 3, name: 'Dispatching to Enclaves' }, // ✅ Line 80-86
  { id: 4, name: 'Enclave Processing' },      // ✅ Line 89-144
  { id: 5, name: 'Computing Consensus' },     // ✅ Line 167-200
  { id: 6, name: 'Blockchain Attestation' },  // ✅ Line 204-251
];
```

---

## ❌ VẤN ĐỀ 1: THIẾU SOCKET EMIT CHO STAGE 1 & 2

### **Backend Upload Route (upload.ts)**
```typescript
// Line 22-94: Upload endpoint
router.post("/upload", upload.single("file"), async (req, res) => {
  // 1. Compute hashes          ← Stage 1: NO SOCKET EMIT ❌
  // 2. Create encryption policy ← Stage 1: NO SOCKET EMIT ❌
  // 3. Encrypt the media        ← Stage 2: NO SOCKET EMIT ❌
  // 4. Store encrypted media    ← Stage 2: NO SOCKET EMIT ❌
  // 5. Create verification job
  // 6. Add to queue
  
  res.json({ jobId, mediaCID, status: "PENDING" }); // Only HTTP response
});
```

**Kết quả:** Frontend hiển thị Stage 1-2 nhưng chúng KHÔNG BAO GIỜ "sáng lên" vì backend không emit progress.

---

## ❌ VẤN ĐỀ 2: SOCKET CONNECTION TIMING

### **Current Flow:**
```
1. User clicks Upload
2. Frontend sends file via HTTP POST → /api/upload
3. Backend processes Stage 1-2 (NO SOCKET)
4. Backend returns jobId
5. Frontend receives jobId ← SỰ KIỆN NÀY MỚI TRIGGER SOCKET
6. Frontend connects socket (line 29-72 in page.tsx)
7. Backend emits Stage 3-6 (CÓ SOCKET)
```

**Vấn đề:** Socket chỉ connect SAU KHI upload xong, nên Stage 1-2 đã qua rồi và không thể nhận được updates.

---

## ❌ VẤN ĐỀ 3: MISSING SOCKETCLIENT DECLARATION

### **Frontend page.tsx**
```typescript
export default function Home() {
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  // ... other state
  
  useEffect(() => {
    if (!currentJobId) return;
    // ...
    socketClient.connect(walletAddress, signature); // ❌ socketClient is not defined
    // Line 72: socketClient.unsubscribeFromJob(currentJobId);
  }, [currentJobId, socketClient]); // ❌ socketClient in deps but not declared
```

**Lỗi:** `socketClient` được sử dụng nhưng không được declare trong component.

---

## 📊 BACKEND SOCKET EMIT MAPPING

### **multiWorkerProcessor.ts**

| Stage | Progress | Location | Substep |
|-------|----------|----------|---------|
| **3** | 20% | Line 80-86 | "Creating N enclave verification tasks..." |
| **4** | 30% | Line 89-95 | "Starting parallel enclave verification..." |
| **4** | 30+15\*i | Line 105-112 | "Enclave X/N: Retrieving and decrypting..." |
| **4** | 35+15\*i | Line 124-131 | "Enclave X/N: Running AI detection..." |
| **4** | 45+15\*i | Line 137-144 | "Enclave X/N: Completed (score: X)" |
| **5** | 75% | Line 167-173 | "Collecting reports from all enclaves..." |
| **5** | 80% | Line 179-185 | "Computing weighted votes..." |
| **5** | 85% | Line 194-200 | "Analysis complete: avg score X" |
| **6** | 90% | Line 204-210 | "Storing final report on Walrus..." |
| **6** | 95% | Line 228-234 | "Submitting attestation to Sui..." |
| **6** | 100% | Line 245-251 | "Verification complete!" |

**✅ STAGE 3-6: HOẠT ĐỘNG TỐT**  
**❌ STAGE 1-2: THIẾU HOÀN TOÀN**

---

## 🔧 GIẢI PHÁP

### **Option A: Thêm Socket Emit vào Upload Route** ⭐ RECOMMENDED

**Pros:**
- Consistent với full flow
- User thấy được toàn bộ process
- Professional UX

**Cons:**
- Cần modify upload route
- Socket phải connect TRƯỚC khi upload

**Implementation:**
1. Frontend connect socket TRƯỚC (khi load page hoặc khi user chọn file)
2. Upload route emit progress cho Stage 1-2
3. Stages 3-6 tiếp tục như hiện tại

---

### **Option B: Xóa Stage 1-2 khỏi Frontend**

**Pros:**
- Quick fix
- Backend code không đổi

**Cons:**
- Mất thông tin về upload/encryption phase
- UX kém hơn (user không biết gì khi upload)

**Implementation:**
1. Chỉ giữ lại 4 stages trong frontend STAGES array
2. Renumber stages 3-6 thành 1-4

---

### **Option C: Mock Stage 1-2 ở Frontend** (TEMPORARY)

**Pros:**
- Quick fix
- Giữ nguyên UI/UX
- Backend không đổi

**Cons:**
- Fake progress (không thật)
- Không chính xác

**Implementation:**
1. Frontend tự động "fake" progress 0-20% trong MediaUploader
2. Khi nhận được jobId → switch sang real socket updates

---

## 🚀 RECOMMENDATION

**Chọn Option A** - Implement full socket flow properly:

1. **Frontend changes:**
   - Connect socket NGAY KHI LOAD PAGE (hoặc khi wallet connected)
   - Upload gửi jobId qua socket handshake
   - Declare socketClient properly

2. **Backend changes:**
   - Upload route emit progress cho Stage 1 (hashing, policy)
   - Upload route emit progress cho Stage 2 (encryption, storage)
   - Stages 3-6 giữ nguyên

Cách này professional nhất và user experience tốt nhất.

---

## 📝 CURRENT STATE SUMMARY

**✅ HOẠT ĐỘNG TỐT:**
- Stage 3-6 emit đầy đủ và chi tiết
- Socket connection/subscription logic correct
- Progress calculation hợp lý (20% → 30% → 75% → 90% → 100%)

**❌ CẦN FIX:**
- Stage 1-2 không có socket emit
- Socket connect sau khi Stage 1-2 đã qua
- `socketClient` not declared in page.tsx
- Frontend STAGES vs Backend stages mismatch

**🎯 IMPACT:**
- User không thấy progress trong 0-20% đầu tiên
- Frontend tree hiển thị stage 1-2 nhưng chúng không bao giờ "active"
- Professional appearance giảm

