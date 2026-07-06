<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import {
  BadgeCheck,
  Car,
  ChevronDown,
  CheckCircle2,
  ClipboardList,
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
const openSelect = ref('');
const deleteTarget = ref(null);
const editTarget = ref(null);
const editForm = reactive({ ...emptyForm });
const editOpenSelect = ref('');

const carTypes = ['รถยนต์', 'รถจักรยานยนต์'];
const statuses = ['ออกแล้ว', 'รอออก', 'หมดอายุ'];

const filteredItems = computed(() => {
  const keyword = search.value.trim().toLowerCase();

  if (!keyword) {
    return items.value;
  }

  return items.value.filter((item) => [
    item.plate_no,
    item.type,
    item.brand_model,
    item.color,
    item.owner,
    item.department,
    item.status,
  ].some((value) => String(value).toLowerCase().includes(keyword)));
});

const statusCounts = computed(() => statuses.map((status) => ({
  label: status,
  total: items.value.filter((item) => item.status === status).length,
})));

function setMessage(type, message) {
  error.value = type === 'error' ? message : '';
  success.value = type === 'success' ? message : '';
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
    throw new Error(payload.message || 'ไม่สามารถเชื่อมต่อระบบได้');
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

function resetForm() {
  Object.assign(form, emptyForm);
  openSelect.value = '';
  setMessage('', '');
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
  editOpenSelect.value = '';
}

function toggleSelect(name) {
  openSelect.value = openSelect.value === name ? '' : name;
}

function chooseOption(field, value) {
  form[field] = value;
  openSelect.value = '';
}

function toggleEditSelect(name) {
  editOpenSelect.value = editOpenSelect.value === name ? '' : name;
}

function chooseEditOption(field, value) {
  editForm[field] = value;
  editOpenSelect.value = '';
}

function closeEditModal() {
  editTarget.value = null;
  editOpenSelect.value = '';
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

    resetForm();
    await loadItems({ keepMessage: true });
    setMessage('success', 'เพิ่มข้อมูลรถแล้ว');
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

function statusClass(status) {
  return {
    'is-ready': status === 'ออกแล้ว',
    'is-waiting': status === 'รอออก',
    'is-expired': status === 'หมดอายุ',
  };
}

onMounted(loadItems);
</script>

<template>
  <main class="shell">
    <div class="particles" aria-hidden="true">
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
    </div>

    <section class="hero">
      <div>
        <p class="eyebrow">
          <Sparkles :size="16" />
          staffcar · Loei Technical College
        </p>
        <h1>ระบบบันทึกข้อมูลรถของบุคลากร</h1>
        <p class="lead">จัดการทะเบียนรถสำหรับออกสติกเกอร์เข้า-ออกวิทยาลัยแบบครบในหน้าเดียว</p>
        <div class="hero-actions" aria-label="การทำงานหลัก">
          <span><PlusCircle :size="18" /> เพิ่มข้อมูลรถ</span>
          <span><Search :size="18" /> ค้นหาได้ทันที</span>
          <span><BadgeCheck :size="18" /> ติดตามสถานะ</span>
        </div>
      </div>

      <div class="owner-card" aria-label="ข้อมูลผู้จัดทำ">
        <span><UserRound :size="17" /> ผู้จัดทำ</span>
        <strong>chetsada suthongsa</strong>
        <small>68319010015 · ปวส2/2</small>
      </div>
    </section>

    <section class="overview" aria-label="สรุปข้อมูล">
      <article class="summary-card">
        <span><Car :size="18" /> รถทั้งหมด</span>
        <strong v-if="!initialLoading">{{ items.length }}</strong>
        <strong v-else class="skeleton skeleton-number"></strong>
      </article>
      <article v-for="count in statusCounts" :key="count.label" class="summary-card">
        <span><CheckCircle2 :size="18" /> {{ count.label }}</span>
        <strong v-if="!initialLoading">{{ count.total }}</strong>
        <strong v-else class="skeleton skeleton-number"></strong>
      </article>
    </section>

    <section class="workspace">
      <form class="panel form-panel" @submit.prevent="saveItem">
        <div class="panel-heading">
          <div>
            <p class="eyebrow">
              <ClipboardList :size="16" />
              Vehicle form
            </p>
            <h2>เพิ่มข้อมูลรถ</h2>
            <p class="panel-note">กรอกข้อมูลให้ครบเพื่อบันทึกสติกเกอร์เข้า-ออกวิทยาลัย</p>
          </div>
          <button type="button" class="ghost-button" @click="resetForm">ล้างฟอร์ม</button>
        </div>

        <div class="message error" v-if="error">{{ error }}</div>
        <div class="message success" v-if="success">{{ success }}</div>

        <div class="field-grid">
          <label>
            <span>ทะเบียนรถ</span>
            <input v-model.trim="form.plate_no" required placeholder="กข 1234 เลย" />
          </label>

          <label>
            <span>ประเภทรถ</span>
            <div class="custom-select" :class="{ 'is-open': openSelect === 'type' }">
              <button
                type="button"
                class="select-trigger"
                :aria-expanded="openSelect === 'type'"
                aria-haspopup="listbox"
                @click="toggleSelect('type')"
              >
                <span>{{ form.type }}</span>
                <ChevronDown :size="18" />
              </button>
              <div v-if="openSelect === 'type'" class="select-menu" role="listbox">
                <button
                  v-for="type in carTypes"
                  :key="type"
                  type="button"
                  class="select-option"
                  :class="{ 'is-selected': form.type === type }"
                  role="option"
                  :aria-selected="form.type === type"
                  @click="chooseOption('type', type)"
                >
                  <Car :size="17" />
                  {{ type }}
                </button>
              </div>
            </div>
          </label>

          <label>
            <span>ยี่ห้อและรุ่น</span>
            <input v-model.trim="form.brand_model" required placeholder="Toyota Yaris" />
          </label>

          <label>
            <span>สี</span>
            <input v-model.trim="form.color" required placeholder="ขาว" />
          </label>

          <label>
            <span>ชื่อเจ้าของ</span>
            <input v-model.trim="form.owner" required placeholder="สมชาย ใจดี" />
          </label>

          <label>
            <span>แผนก</span>
            <input v-model.trim="form.department" required placeholder="เทคโนโลยีสารสนเทศ" />
          </label>

          <label class="full">
            <span>สถานะ</span>
            <div class="custom-select" :class="{ 'is-open': openSelect === 'status' }">
              <button
                type="button"
                class="select-trigger"
                :aria-expanded="openSelect === 'status'"
                aria-haspopup="listbox"
                @click="toggleSelect('status')"
              >
                <span class="status-dot" :class="statusClass(form.status)">{{ form.status }}</span>
                <ChevronDown :size="18" />
              </button>
              <div v-if="openSelect === 'status'" class="select-menu" role="listbox">
                <button
                  v-for="status in statuses"
                  :key="status"
                  type="button"
                  class="select-option"
                  :class="{ 'is-selected': form.status === status }"
                  role="option"
                  :aria-selected="form.status === status"
                  @click="chooseOption('status', status)"
                >
                  <CheckCircle2 :size="17" />
                  {{ status }}
                </button>
              </div>
            </div>
          </label>
        </div>

        <button class="primary-button" type="submit" :disabled="saving">
          <CheckCircle2 :size="20" />
          {{ saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล' }}
        </button>
      </form>

      <section class="panel list-panel">
        <div class="panel-heading">
          <div>
            <p class="eyebrow">
              <Car :size="16" />
              Vehicle records
            </p>
            <h2>รายการรถบุคลากร</h2>
            <p class="panel-note">ดูสถานะ ค้นหา และจัดการข้อมูลรถได้จากรายการนี้</p>
          </div>
          <button type="button" class="ghost-button" :disabled="loading" @click="loadItems({ mode: 'refresh' })">
            <span v-if="refreshing" class="spinner" aria-hidden="true"></span>
            <RefreshCw v-else :size="18" />
            {{ refreshing ? 'กำลังรีเฟรช...' : 'รีเฟรช' }}
          </button>
        </div>

        <label class="search-box">
          <span><Search :size="17" /> ค้นหา</span>
          <div class="search-input">
            <Search :size="18" />
            <input v-model.trim="search" placeholder="ทะเบียน เจ้าของ แผนก หรือสถานะ" />
          </div>
        </label>

        <div v-if="initialLoading" class="skeleton-stack" aria-label="กำลังโหลดข้อมูล">
          <div class="skeleton-table">
            <span v-for="row in 5" :key="`table-skeleton-${row}`" class="skeleton skeleton-row"></span>
          </div>
          <div class="skeleton-cards">
            <span v-for="row in 3" :key="`card-skeleton-${row}`" class="skeleton skeleton-card"></span>
          </div>
        </div>

        <div class="empty-state" v-else-if="filteredItems.length === 0">
          <Sparkles :size="28" />
          <strong>ยังไม่มีข้อมูลรถ</strong>
          <span>เริ่มจากเพิ่มข้อมูลคันแรก หรือปรับคำค้นหาอีกครั้ง</span>
        </div>

        <div class="table-wrap" v-else :class="{ 'is-refreshing': refreshing }">
          <table>
            <thead>
              <tr>
                <th>ทะเบียน</th>
                <th>ประเภท</th>
                <th>รถ</th>
                <th>เจ้าของ</th>
                <th>แผนก</th>
                <th>สถานะ</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in filteredItems" :key="item.id">
                <td class="plate">{{ item.plate_no }}</td>
                <td>{{ item.type }}</td>
                <td>{{ item.brand_model }} · {{ item.color }}</td>
                <td>{{ item.owner }}</td>
                <td>{{ item.department }}</td>
                <td>
                  <span class="status" :class="statusClass(item.status)">{{ item.status }}</span>
                </td>
                <td>
                  <div class="row-actions">
                    <button type="button" class="small-button" @click="editItem(item)">
                      <Edit3 :size="16" />
                      แก้ไข
                    </button>
                    <button type="button" class="small-button danger" @click="deleteItem(item)">
                      <Trash2 :size="16" />
                      ลบ
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="record-cards" v-if="!initialLoading && filteredItems.length > 0" :class="{ 'is-refreshing': refreshing }">
          <article v-for="item in filteredItems" :key="`card-${item.id}`" class="record-card">
            <div class="record-card__top">
              <div>
                <span class="record-label">ทะเบียนรถ</span>
                <strong>{{ item.plate_no }}</strong>
              </div>
              <span class="status" :class="statusClass(item.status)">{{ item.status }}</span>
            </div>

            <dl class="record-grid">
              <div>
                <dt>ประเภท</dt>
                <dd>{{ item.type }}</dd>
              </div>
              <div>
                <dt>รถ</dt>
                <dd>{{ item.brand_model }} · {{ item.color }}</dd>
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

            <div class="card-actions">
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
            {{ loading ? 'กำลังลบ...' : 'ยืนยันลบ' }}
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
            <input v-model.trim="editForm.plate_no" required placeholder="กข 1234 เลย" />
          </label>

          <label>
            <span>ประเภทรถ</span>
            <div class="custom-select" :class="{ 'is-open': editOpenSelect === 'type' }">
              <button
                type="button"
                class="select-trigger"
                :aria-expanded="editOpenSelect === 'type'"
                aria-haspopup="listbox"
                @click="toggleEditSelect('type')"
              >
                <span>{{ editForm.type }}</span>
                <ChevronDown :size="18" />
              </button>
              <div v-if="editOpenSelect === 'type'" class="select-menu" role="listbox">
                <button
                  v-for="type in carTypes"
                  :key="type"
                  type="button"
                  class="select-option"
                  :class="{ 'is-selected': editForm.type === type }"
                  role="option"
                  :aria-selected="editForm.type === type"
                  @click="chooseEditOption('type', type)"
                >
                  <Car :size="17" />
                  {{ type }}
                </button>
              </div>
            </div>
          </label>

          <label>
            <span>ยี่ห้อและรุ่น</span>
            <input v-model.trim="editForm.brand_model" required placeholder="Toyota Yaris" />
          </label>

          <label>
            <span>สี</span>
            <input v-model.trim="editForm.color" required placeholder="ขาว" />
          </label>

          <label>
            <span>ชื่อเจ้าของ</span>
            <input v-model.trim="editForm.owner" required placeholder="สมชาย ใจดี" />
          </label>

          <label>
            <span>แผนก</span>
            <input v-model.trim="editForm.department" required placeholder="เทคโนโลยีสารสนเทศ" />
          </label>

          <label class="full">
            <span>สถานะ</span>
            <div class="custom-select" :class="{ 'is-open': editOpenSelect === 'status' }">
              <button
                type="button"
                class="select-trigger"
                :aria-expanded="editOpenSelect === 'status'"
                aria-haspopup="listbox"
                @click="toggleEditSelect('status')"
              >
                <span class="status-dot" :class="statusClass(editForm.status)">{{ editForm.status }}</span>
                <ChevronDown :size="18" />
              </button>
              <div v-if="editOpenSelect === 'status'" class="select-menu" role="listbox">
                <button
                  v-for="status in statuses"
                  :key="status"
                  type="button"
                  class="select-option"
                  :class="{ 'is-selected': editForm.status === status }"
                  role="option"
                  :aria-selected="editForm.status === status"
                  @click="chooseEditOption('status', status)"
                >
                  <CheckCircle2 :size="17" />
                  {{ status }}
                </button>
              </div>
            </div>
          </label>

          <div class="confirm-actions full">
            <button type="button" class="ghost-button" @click="closeEditModal">ยกเลิก</button>
            <button type="submit" class="primary-button" :disabled="saving">
              <CheckCircle2 :size="18" />
              {{ saving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข' }}
            </button>
          </div>
        </form>
      </section>
    </div>
  </main>
</template>
