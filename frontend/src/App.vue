<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import {
  AlertTriangle,
  BadgeCheck,
  Bike,
  Car,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Edit3,
  PlusCircle,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  UserRound,
  X,
} from 'lucide-vue-next';

const emptyForm = {
  plate_no: '',
  type: 'รถยนต์',
  brand_model: '',
  color: '',
  owner: '',
  department: '',
  status: 'รอออก',
};

const items = ref([]);
const form = reactive({ ...emptyForm });
const loading = ref(false);
const initialLoading = ref(true);
const refreshing = ref(false);
const saving = ref(false);
const error = ref('');
const success = ref('');
const search = ref('');
const statusFilter = ref('ทั้งหมด');
const addModalOpen = ref(false);
const deleteTarget = ref(null);
const editTarget = ref(null);
const editForm = reactive({ ...emptyForm });

const carTypes = ['รถยนต์', 'รถจักรยานยนต์'];
const statuses = ['ออกแล้ว', 'รอออก', 'หมดอายุ'];
const filterOptions = ['ทั้งหมด', ...statuses];

const filteredItems = computed(() => {
  const keyword = search.value.trim().toLowerCase();

  return items.value.filter((item) => {
    const matchesStatus = statusFilter.value === 'ทั้งหมด' || item.status === statusFilter.value;
    const matchesKeyword = !keyword || [
      item.plate_no,
      item.type,
      item.brand_model,
      item.color,
      item.owner,
      item.department,
      item.status,
    ].some((value) => String(value).toLowerCase().includes(keyword));

    return matchesStatus && matchesKeyword;
  });
});

const summaryCards = computed(() => [
  {
    label: 'รถทั้งหมด',
    helper: 'ข้อมูลในระบบ',
    total: items.value.length,
    filter: 'ทั้งหมด',
  },
  ...statuses.map((status) => ({
    label: status,
    helper: statusHelper(status),
    total: items.value.filter((item) => item.status === status).length,
    filter: status,
  })),
]);

const emptyTitle = computed(() => (
  items.value.length === 0
    ? 'ยังไม่มีข้อมูลรถ'
    : 'ไม่พบข้อมูลที่ตรงกับเงื่อนไข'
));

const emptyDescription = computed(() => (
  items.value.length === 0
    ? 'เริ่มจากเพิ่มข้อมูลรถคันแรก ระบบจะแสดงรายการให้จัดการได้ทันที'
    : 'ลองล้างคำค้นหา หรือเลือกสถานะทั้งหมดเพื่อดูรายการอีกครั้ง'
));

function setMessage(type, message) {
  error.value = type === 'error' ? message : '';
  success.value = type === 'success' ? message : '';
}

function friendlyError(message) {
  if (!message) {
    return 'ไม่สามารถเชื่อมต่อระบบได้';
  }

  if (message.includes('plate_no already exists')) {
    return 'มีทะเบียนนี้อยู่แล้ว กรุณาตรวจสอบทะเบียนรถอีกครั้ง';
  }

  if (message.includes('Missing required fields')) {
    return 'กรุณากรอกข้อมูลให้ครบทุกช่อง';
  }

  if (message.includes('car not found')) {
    return 'ไม่พบข้อมูลรถคันนี้ อาจถูกลบไปแล้ว';
  }

  if (message.includes('database error')) {
    return 'ฐานข้อมูลไม่พร้อมใช้งาน กรุณาลองใหม่อีกครั้ง';
  }

  return message;
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(friendlyError(payload.message));
  }

  return payload;
}

async function loadItems({ keepMessage = false, mode = 'load' } = {}) {
  loading.value = true;
  refreshing.value = mode === 'refresh';

  if (!keepMessage) {
    setMessage('', '');
  }

  try {
    const payload = await requestJson('/api/items');

    if (!Array.isArray(payload)) {
      throw new Error('เชื่อมต่อ API ไม่ถูกต้อง กรุณาตรวจว่า backend staffcar รันที่พอร์ต 3001');
    }

    items.value = payload;
  } catch (loadError) {
    setMessage('error', loadError.message);
  } finally {
    loading.value = false;
    refreshing.value = false;
    initialLoading.value = false;
  }
}

function openAddModal() {
  addModalOpen.value = true;
  setMessage('', '');
}

function closeAddModal() {
  addModalOpen.value = false;
  Object.assign(form, emptyForm);
}

function editItem(item) {
  editTarget.value = item;
  Object.assign(editForm, {
    plate_no: item.plate_no,
    type: item.type,
    brand_model: item.brand_model,
    color: item.color,
    owner: item.owner,
    department: item.department,
    status: item.status,
  });
}

function closeEditModal() {
  editTarget.value = null;
  Object.assign(editForm, emptyForm);
}

async function saveItem() {
  saving.value = true;
  setMessage('', '');

  try {
    await requestJson('/api/items', {
      method: 'POST',
      body: JSON.stringify(form),
    });

    closeAddModal();
    await loadItems({ keepMessage: true });
    setMessage('success', 'เพิ่มข้อมูลรถเรียบร้อย');
  } catch (saveError) {
    setMessage('error', saveError.message);
  } finally {
    saving.value = false;
  }
}

async function saveEditItem() {
  if (!editTarget.value) {
    return;
  }

  saving.value = true;
  setMessage('', '');

  try {
    await requestJson(`/api/items/${editTarget.value.id}`, {
      method: 'PUT',
      body: JSON.stringify(editForm),
    });

    const plate = editForm.plate_no;
    closeEditModal();
    await loadItems({ keepMessage: true });
    setMessage('success', `บันทึกการแก้ไขทะเบียน ${plate} แล้ว`);
  } catch (saveError) {
    setMessage('error', saveError.message);
  } finally {
    saving.value = false;
  }
}

function deleteItem(item) {
  deleteTarget.value = item;
}

function cancelDelete() {
  deleteTarget.value = null;
}

async function confirmDelete() {
  if (!deleteTarget.value) {
    return;
  }

  const item = deleteTarget.value;
  loading.value = true;
  setMessage('', '');

  try {
    await requestJson(`/api/items/${item.id}`, { method: 'DELETE' });
    await loadItems({ keepMessage: true });
    setMessage('success', `ลบทะเบียน ${item.plate_no} แล้ว`);
    deleteTarget.value = null;
  } catch (deleteError) {
    setMessage('error', deleteError.message);
  } finally {
    loading.value = false;
  }
}

function clearSearch() {
  search.value = '';
}

function resetFilters() {
  search.value = '';
  statusFilter.value = 'ทั้งหมด';
}

function statusHelper(status) {
  if (status === 'ออกแล้ว') {
    return 'ออกสติกเกอร์แล้ว';
  }

  if (status === 'รอออก') {
    return 'รอดำเนินการ';
  }

  return 'ต้องตรวจสอบ';
}

function statusClass(status) {
  return {
    'is-ready': status === 'ออกแล้ว',
    'is-waiting': status === 'รอออก',
    'is-expired': status === 'หมดอายุ',
  };
}

onMounted(() => loadItems());
</script>

<template>
  <main class="shell">
    <div class="particles" aria-hidden="true">
      <i></i>
      <i></i>
      <i></i>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
    </div>

    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">
          <Sparkles :size="16" />
          staffcar - Loei Technical College
        </p>
        <h1>ระบบบันทึกข้อมูลรถของบุคลากร</h1>
        <p class="lead">ค้นหา เพิ่ม แก้ไข และติดตามสถานะสติกเกอร์รถได้ครบในหน้าเดียว</p>
        <div class="hero-actions" aria-label="การทำงานหลัก">
          <button type="button" class="hero-action primary" @click="openAddModal">
            <PlusCircle :size="18" />
            เพิ่มข้อมูลรถ
          </button>
          <a class="hero-action" href="#records-title">
            <ClipboardList :size="18" />
            ไปที่รายการ
          </a>
          <span class="hero-action">
            <BadgeCheck :size="18" />
            ติดตามสถานะ
          </span>
        </div>
      </div>

      <div class="owner-card" aria-label="ข้อมูลผู้จัดทำ">
        <span><UserRound :size="17" /> ผู้จัดทำ</span>
        <strong>chetsada suthongsa</strong>
        <small>68319010015 - ปวส2/2</small>
      </div>
    </section>

    <section class="overview" aria-label="สรุปข้อมูล">
      <button
        v-for="card in summaryCards"
        :key="card.label"
        type="button"
        class="summary-card"
        :class="{ 'is-active': statusFilter === card.filter }"
        :disabled="initialLoading"
        @click="statusFilter = card.filter"
      >
        <span>
          <Car v-if="card.filter === 'ทั้งหมด'" :size="18" />
          <CheckCircle2 v-else-if="card.filter === 'ออกแล้ว'" :size="18" />
          <Clock3 v-else-if="card.filter === 'รอออก'" :size="18" />
          <AlertTriangle v-else :size="18" />
          {{ card.label }}
        </span>
        <strong v-if="!initialLoading">{{ card.total }}</strong>
        <strong v-else class="skeleton skeleton-number"></strong>
        <small>{{ card.helper }}</small>
      </button>
    </section>

    <section class="workspace">
      <section class="panel list-panel" aria-labelledby="records-title">
        <div class="panel-heading">
          <div>
            <p class="eyebrow">
              <ClipboardList :size="16" />
              Vehicle records
            </p>
            <h2 id="records-title">รายการรถบุคลากร</h2>
            <p class="panel-note">กรองสถานะ ค้นหา และจัดการข้อมูลรถได้จากรายการนี้</p>
          </div>
          <div class="panel-actions">
            <button type="button" class="primary-button add-button" @click="openAddModal">
              <PlusCircle :size="19" />
              เพิ่มข้อมูลรถ
            </button>
            <button type="button" class="ghost-button" :disabled="loading" @click="loadItems({ mode: 'refresh' })">
              <span v-if="refreshing" class="spinner" aria-hidden="true"></span>
              <RefreshCw v-else :size="18" />
              {{ refreshing ? 'กำลังรีเฟรช' : 'รีเฟรช' }}
            </button>
          </div>
        </div>

        <div class="message error" v-if="error" role="alert">{{ error }}</div>
        <div class="message success" v-if="success" role="status">{{ success }}</div>

        <div class="records-toolbar">
          <label class="search-box">
            <span>ค้นหา</span>
            <div class="search-input">
              <Search :size="18" aria-hidden="true" />
              <input v-model.trim="search" placeholder="พิมพ์ทะเบียน เจ้าของ แผนก หรือสถานะ" />
              <button v-if="search" type="button" class="clear-search" aria-label="ล้างคำค้นหา" @click="clearSearch">
                <X :size="16" />
              </button>
            </div>
          </label>

          <div class="filter-group" role="group" aria-label="กรองสถานะ">
            <span>สถานะ</span>
            <div class="filter-pills">
              <button
                v-for="option in filterOptions"
                :key="option"
                type="button"
                class="filter-pill"
                :class="{ 'is-active': statusFilter === option }"
                @click="statusFilter = option"
              >
                <ClipboardList v-if="option === 'ทั้งหมด'" :size="16" />
                <CheckCircle2 v-else-if="option === 'ออกแล้ว'" :size="16" />
                <Clock3 v-else-if="option === 'รอออก'" :size="16" />
                <AlertTriangle v-else :size="16" />
                {{ option }}
              </button>
            </div>
          </div>

          <div class="record-count" aria-live="polite">
            <strong>{{ initialLoading ? '-' : filteredItems.length }}</strong>
            <span>รายการที่แสดง</span>
          </div>
        </div>

        <div v-if="initialLoading" class="skeleton-stack" aria-label="กำลังโหลดข้อมูล">
          <div class="skeleton-cards">
            <span v-for="row in 3" :key="`card-skeleton-${row}`" class="skeleton skeleton-card"></span>
          </div>
        </div>

        <div class="empty-state" v-else-if="filteredItems.length === 0">
          <Sparkles :size="28" />
          <strong>{{ emptyTitle }}</strong>
          <span>{{ emptyDescription }}</span>
          <div class="empty-actions">
            <button v-if="items.length === 0" type="button" class="primary-button add-button" @click="openAddModal">
              <PlusCircle :size="18" />
              เพิ่มข้อมูลรถ
            </button>
            <button v-else type="button" class="ghost-button" @click="resetFilters">
              ล้างตัวกรอง
            </button>
          </div>
        </div>

        <div class="records-board" v-else :class="{ 'is-refreshing': refreshing }">
          <article v-for="item in filteredItems" :key="item.id" class="record-list-card">
            <div class="record-main">
              <div class="plate-block">
                <span class="record-label">ทะเบียนรถ</span>
                <strong class="plate">{{ item.plate_no }}</strong>
                <span class="type-chip">
                  <Car v-if="item.type === 'รถยนต์'" :size="15" />
                  <Bike v-else :size="15" />
                  {{ item.type }}
                </span>
              </div>
              <span class="status" :class="statusClass(item.status)">{{ item.status }}</span>
            </div>

            <dl class="record-meta">
              <div>
                <dt>ยี่ห้อและรุ่น</dt>
                <dd>{{ item.brand_model }}</dd>
              </div>
              <div>
                <dt>สี</dt>
                <dd>{{ item.color }}</dd>
              </div>
              <div>
                <dt>เจ้าของ</dt>
                <dd>{{ item.owner }}</dd>
              </div>
              <div>
                <dt>แผนก</dt>
                <dd>{{ item.department }}</dd>
              </div>
            </dl>

            <div class="record-actions">
              <button type="button" class="small-button" @click="editItem(item)">
                <Edit3 :size="16" />
                แก้ไข
              </button>
              <button type="button" class="small-button danger" @click="deleteItem(item)">
                <Trash2 :size="16" />
                ลบ
              </button>
            </div>
          </article>
        </div>
      </section>
    </section>

    <div v-if="addModalOpen" class="confirm-backdrop" role="presentation" @click.self="closeAddModal">
      <section class="confirm-dialog edit-dialog add-dialog" role="dialog" aria-modal="true" aria-labelledby="add-title">
        <button type="button" class="confirm-close" aria-label="ปิดหน้าต่างเพิ่มข้อมูล" @click="closeAddModal">
          <X :size="18" />
        </button>
        <div class="confirm-icon edit-icon">
          <PlusCircle :size="28" />
        </div>
        <p class="eyebrow">Add vehicle</p>
        <h2 id="add-title">เพิ่มข้อมูลรถ</h2>
        <p>กรอกข้อมูลตามลำดับ ระบบจะใช้ข้อมูลนี้สำหรับสติกเกอร์เข้า-ออกวิทยาลัย</p>

        <form class="modal-field-grid" @submit.prevent="saveItem">
          <label>
            <span>ทะเบียนรถ</span>
            <input v-model.trim="form.plate_no" required placeholder="กข 1234 เลย" autocomplete="off" />
            <small>ใส่จังหวัดท้ายทะเบียนถ้ามี เพื่อช่วยค้นหาในภายหลัง</small>
          </label>

          <fieldset class="choice-field">
            <legend>ประเภทรถ</legend>
            <div class="segmented-control two">
              <label v-for="type in carTypes" :key="type" :class="{ 'is-selected': form.type === type }">
                <input v-model="form.type" type="radio" name="type" :value="type" />
                <span>
                  <Car v-if="type === 'รถยนต์'" :size="16" />
                  <Bike v-else :size="16" />
                  {{ type }}
                </span>
              </label>
            </div>
          </fieldset>

          <label>
            <span>ยี่ห้อและรุ่น</span>
            <input v-model.trim="form.brand_model" required placeholder="Toyota Yaris" autocomplete="off" />
          </label>

          <label>
            <span>สี</span>
            <input v-model.trim="form.color" required placeholder="ขาว" autocomplete="off" />
          </label>

          <label>
            <span>ชื่อเจ้าของ</span>
            <input v-model.trim="form.owner" required placeholder="สมชาย ใจดี" autocomplete="name" />
          </label>

          <label>
            <span>แผนก</span>
            <input v-model.trim="form.department" required placeholder="เทคโนโลยีสารสนเทศ" autocomplete="organization" />
          </label>

          <fieldset class="choice-field full">
            <legend>สถานะ</legend>
            <div class="segmented-control three">
              <label
                v-for="status in statuses"
                :key="status"
                :class="[statusClass(status), { 'is-selected': form.status === status }]"
              >
                <input v-model="form.status" type="radio" name="status" :value="status" />
                <span>
                  <CheckCircle2 v-if="status === 'ออกแล้ว'" :size="16" />
                  <Clock3 v-else-if="status === 'รอออก'" :size="16" />
                  <AlertTriangle v-else :size="16" />
                  {{ status }}
                </span>
              </label>
            </div>
          </fieldset>

          <div class="confirm-actions full">
            <button type="button" class="ghost-button" @click="closeAddModal">ยกเลิก</button>
            <button type="submit" class="primary-button" :disabled="saving">
              <CheckCircle2 :size="18" />
              {{ saving ? 'กำลังบันทึก' : 'บันทึกข้อมูล' }}
            </button>
          </div>
        </form>
      </section>
    </div>

    <div v-if="deleteTarget" class="confirm-backdrop" role="presentation" @click.self="cancelDelete">
      <section class="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-title">
        <button type="button" class="confirm-close" aria-label="ปิดหน้าต่างยืนยัน" @click="cancelDelete">
          <X :size="18" />
        </button>
        <div class="confirm-icon">
          <Trash2 :size="28" />
        </div>
        <p class="eyebrow">Confirm delete</p>
        <h2 id="delete-title">ลบข้อมูลรถคันนี้?</h2>
        <p>
          ระบบจะลบทะเบียน
          <strong>{{ deleteTarget.plate_no }}</strong>
          ของ {{ deleteTarget.owner }} ออกจากรายการ
        </p>
        <div class="confirm-actions">
          <button type="button" class="ghost-button" @click="cancelDelete">ยกเลิก</button>
          <button type="button" class="primary-button danger-confirm" :disabled="loading" @click="confirmDelete">
            <Trash2 :size="18" />
            {{ loading ? 'กำลังลบ' : 'ยืนยันลบ' }}
          </button>
        </div>
      </section>
    </div>

    <div v-if="editTarget" class="confirm-backdrop" role="presentation" @click.self="closeEditModal">
      <section class="confirm-dialog edit-dialog" role="dialog" aria-modal="true" aria-labelledby="edit-title">
        <button type="button" class="confirm-close" aria-label="ปิดหน้าต่างแก้ไข" @click="closeEditModal">
          <X :size="18" />
        </button>
        <div class="confirm-icon edit-icon">
          <Edit3 :size="28" />
        </div>
        <p class="eyebrow">Edit vehicle</p>
        <h2 id="edit-title">แก้ไขข้อมูลรถ</h2>
        <p>ปรับข้อมูลทะเบียน <strong>{{ editTarget.plate_no }}</strong> แล้วกดบันทึก</p>

        <form class="modal-field-grid" @submit.prevent="saveEditItem">
          <label>
            <span>ทะเบียนรถ</span>
            <input v-model.trim="editForm.plate_no" required placeholder="กข 1234 เลย" autocomplete="off" />
          </label>

          <fieldset class="choice-field">
            <legend>ประเภทรถ</legend>
            <div class="segmented-control two">
              <label v-for="type in carTypes" :key="type" :class="{ 'is-selected': editForm.type === type }">
                <input v-model="editForm.type" type="radio" name="edit-type" :value="type" />
                <span>
                  <Car v-if="type === 'รถยนต์'" :size="16" />
                  <Bike v-else :size="16" />
                  {{ type }}
                </span>
              </label>
            </div>
          </fieldset>

          <label>
            <span>ยี่ห้อและรุ่น</span>
            <input v-model.trim="editForm.brand_model" required placeholder="Toyota Yaris" autocomplete="off" />
          </label>

          <label>
            <span>สี</span>
            <input v-model.trim="editForm.color" required placeholder="ขาว" autocomplete="off" />
          </label>

          <label>
            <span>ชื่อเจ้าของ</span>
            <input v-model.trim="editForm.owner" required placeholder="สมชาย ใจดี" autocomplete="name" />
          </label>

          <label>
            <span>แผนก</span>
            <input v-model.trim="editForm.department" required placeholder="เทคโนโลยีสารสนเทศ" autocomplete="organization" />
          </label>

          <fieldset class="choice-field full">
            <legend>สถานะ</legend>
            <div class="segmented-control three">
              <label
                v-for="status in statuses"
                :key="status"
                :class="[statusClass(status), { 'is-selected': editForm.status === status }]"
              >
                <input v-model="editForm.status" type="radio" name="edit-status" :value="status" />
                <span>
                  <CheckCircle2 v-if="status === 'ออกแล้ว'" :size="16" />
                  <Clock3 v-else-if="status === 'รอออก'" :size="16" />
                  <AlertTriangle v-else :size="16" />
                  {{ status }}
                </span>
              </label>
            </div>
          </fieldset>

          <div class="confirm-actions full">
            <button type="button" class="ghost-button" @click="closeEditModal">ยกเลิก</button>
            <button type="submit" class="primary-button" :disabled="saving">
              <CheckCircle2 :size="18" />
              {{ saving ? 'กำลังบันทึก' : 'บันทึกการแก้ไข' }}
            </button>
          </div>
        </form>
      </section>
    </div>
  </main>
</template>
