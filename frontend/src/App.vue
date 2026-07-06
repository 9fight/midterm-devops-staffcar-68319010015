<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import {
  BadgeCheck,
  Car,
  CheckCircle2,
  ClipboardList,
  Edit3,
  PlusCircle,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  UserRound,
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
const editingId = ref(null);
const loading = ref(false);
const saving = ref(false);
const error = ref('');
const success = ref('');
const search = ref('');

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

async function loadItems({ keepMessage = false } = {}) {
  loading.value = true;

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
  }
}

function resetForm() {
  Object.assign(form, emptyForm);
  editingId.value = null;
  setMessage('', '');
}

function editItem(item) {
  Object.assign(form, {
    plate_no: item.plate_no,
    type: item.type,
    brand_model: item.brand_model,
    color: item.color,
    owner: item.owner,
    department: item.department,
    status: item.status,
  });
  editingId.value = item.id;
  setMessage('success', `กำลังแก้ไขทะเบียน ${item.plate_no}`);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function saveItem() {
  saving.value = true;
  setMessage('', '');

  try {
    const method = editingId.value ? 'PUT' : 'POST';
    const url = editingId.value ? `/api/items/${editingId.value}` : '/api/items';

    await requestJson(url, {
      method,
      body: JSON.stringify(form),
    });

    const message = editingId.value ? 'บันทึกการแก้ไขแล้ว' : 'เพิ่มข้อมูลรถแล้ว';
    resetForm();
    await loadItems({ keepMessage: true });
    setMessage('success', message);
  } catch (saveError) {
    setMessage('error', saveError.message);
  } finally {
    saving.value = false;
  }
}

async function deleteItem(item) {
  const confirmed = window.confirm(`ลบข้อมูลทะเบียน ${item.plate_no} ใช่หรือไม่`);

  if (!confirmed) {
    return;
  }

  loading.value = true;
  setMessage('', '');

  try {
    await requestJson(`/api/items/${item.id}`, { method: 'DELETE' });
    await loadItems({ keepMessage: true });
    setMessage('success', `ลบทะเบียน ${item.plate_no} แล้ว`);
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
        <strong>{{ items.length }}</strong>
      </article>
      <article v-for="count in statusCounts" :key="count.label" class="summary-card">
        <span><CheckCircle2 :size="18" /> {{ count.label }}</span>
        <strong>{{ count.total }}</strong>
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
            <h2>{{ editingId ? 'แก้ไขข้อมูลรถ' : 'เพิ่มข้อมูลรถ' }}</h2>
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
            <select v-model="form.type" required>
              <option v-for="type in carTypes" :key="type" :value="type">{{ type }}</option>
            </select>
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
            <select v-model="form.status" required>
              <option v-for="status in statuses" :key="status" :value="status">{{ status }}</option>
            </select>
          </label>
        </div>

        <button class="primary-button" type="submit" :disabled="saving">
          <CheckCircle2 :size="20" />
          {{ saving ? 'กำลังบันทึก...' : editingId ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล' }}
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
          <button type="button" class="ghost-button" :disabled="loading" @click="loadItems">
            <RefreshCw :size="18" />
            {{ loading ? 'กำลังโหลด...' : 'รีเฟรช' }}
          </button>
        </div>

        <label class="search-box">
          <span><Search :size="17" /> ค้นหา</span>
          <div class="search-input">
            <Search :size="18" />
            <input v-model.trim="search" placeholder="ทะเบียน เจ้าของ แผนก หรือสถานะ" />
          </div>
        </label>

        <div class="empty-state" v-if="!loading && filteredItems.length === 0">
          <Sparkles :size="28" />
          <strong>ยังไม่มีข้อมูลรถ</strong>
          <span>เริ่มจากเพิ่มข้อมูลคันแรก หรือปรับคำค้นหาอีกครั้ง</span>
        </div>

        <div class="table-wrap" v-else>
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

        <div class="record-cards" v-if="!loading && filteredItems.length > 0">
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
  </main>
</template>
