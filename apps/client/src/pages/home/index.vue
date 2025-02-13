<template>
  <div class="min-h-screen">
    <div class="p-4">
      <div class="flex justify-end">
        <el-button type="primary" @click="handleCreate">创建扫描</el-button>
      </div>
      <el-table :data="data">
        <el-table-column prop="report_name" label="名称" />
        <el-table-column prop="version" label="版本" />
        <el-table-column prop="target_system" label="目标系统" />
        <el-table-column label="扫描时间">
          <template #default="{ row }">
            <div>{{ row.start_date }} - {{ row.end_date }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" />
        <el-table-column prop="create_time" label="创建时间">
          <template #default="{ row }">
            {{ dayJsformat(row.create_time, 'YYYY-MM-DD HH:mm:ss') }}
          </template>
        </el-table-column>
        <el-table-column label="操作">
          <template #default="{ row }">
            <el-button v-if="row.status === 'success'" type="primary" @click="handleDownload(row)">
              下载
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <Edit v-model="editVisible" @success="getList" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/plugins/axios';
import { ScanListResult, LaunchForm } from '@/types';
import { dayJsformat } from '@m170/utils/common';

import Edit from './components/edit.vue';
import { ElMessage } from 'element-plus';

const editVisible = ref(false);

const data = ref<ScanListResult[]>([]);

async function getList() {
  try {
    const res = await api('/main/scan-list', {});
    data.value = res.list;
  } catch (error) {
    ElMessage.error(error.message || '获取扫描列表失败');
    console.error(error);
  }
}

function handleCreate() {
  editVisible.value = true;
}

async function handleDownload(row: ScanListResult) {
  // const res = await api('/main/download-report', { scan_id: row.scan_id });
  // console.log(res);


}

onMounted(getList);
</script>

<style lang="postcss" scoped></style>

