<template>
  <el-dialog
    v-model="visible"
    title="新增扫描"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <div class="mb-2 text-base font-bold">扫描设置</div>
      <el-form-item label="入口URL" prop="target">
        <el-input v-model="form.target" placeholder="示例：https://www.medomino.com" />
      </el-form-item>
      <el-form-item label="浏览器Record记录" prop="recordJson">
        <el-input
          v-model="form.recordJson"
          placeholder="示例：{}"
          type="textarea"
          :autosize="{ minRows: 8, maxRows: 10 }"
        />
      </el-form-item>
      <!-- <el-form-item label="浏览器headers" prop="cookies">
        <el-input
          v-model="form.headers"
          placeholder="示例：{}"
          type="textarea"
          :autosize="{ minRows: 8, maxRows: 10 }"
        />
      </el-form-item> -->

      <div class="mt-4 text-base font-bold">报告设置</div>
      <el-form-item label="报告名称" prop="report_name">
        <el-input v-model="form.report_name" placeholder="示例：慧牍扫描报告" />
      </el-form-item>
      <el-form-item label="报告版本" prop="version">
        <el-input v-model="form.version" placeholder="示例：V1.0" />
      </el-form-item>
      <el-form-item label="目标系统" prop="target_system">
        <el-input v-model="form.target_system" placeholder="示例：慧牍" />
      </el-form-item>
      <el-form-item label="扫描时间" prop="dateRange">
        <el-date-picker
          v-model="form.dateRange"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button :loading="loading" @click="handleCancel">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import { FormRules, FormInstance, ElMessage } from 'element-plus';
import { api } from '@/plugins/axios';
import { LaunchForm } from '@/types';
import { dayJsformat } from '@m170/utils/common';

const emit = defineEmits(['success']);

/* scan_id: string;
target: string;
report_name: string;
version: string;
target_system: string;
start_date: string;
end_date: string;
scanSpeed?: number;
headers?: Record<string, string>;
cookies?: Record<string, string>;
localStorages?: {
  name: string;
  value: string;
}[];
recordJson?: BrowserActionRecord; */

type LocalForm = Partial<
  Omit<
    LaunchForm,
    'scan_id' | 'headers' | 'cookies' | 'localStorages' | 'recordJson' | 'start_date' | 'end_date'
  > & {
    dateRange: string[];
    headers: string;
    recordJson: string;
  }
>;
const form = ref<LocalForm>({});
const formRef = ref<FormInstance>();
const loading = ref(false);

const rules = ref<FormRules>({
  target: [{ required: true, message: '请输入入口URL', trigger: 'blur' }],
  recordJson: [{ required: true, message: '请输入浏览器Record记录', trigger: 'blur' }],
  headers: [{ required: true, message: '请输入浏览器headers', trigger: 'blur' }],
  report_name: [{ required: true, message: '请输入报告名称', trigger: 'blur' }],
  version: [{ required: true, message: '请输入报告版本', trigger: 'blur' }],
  target_system: [{ required: true, message: '请输入目标系统', trigger: 'blur' }],
  dateRange: [{ required: true, message: '请输入扫描时间', trigger: 'blur' }],
});

const visible = defineModel({
  type: Boolean,
  default: false,
});

watchEffect(() => {
  if (visible.value) {
    form.value = {};
  }
});

const handleCancel = () => {
  visible.value = false;
};

const handleSubmit = async () => {
  loading.value = true;
  await formRef.value?.validate();

  try {
    const { target, recordJson, target_system, dateRange, version, report_name } = form.value;

    const json = JSON.parse(recordJson || '{}');

    await api('/main/create-scan', {
      start_date: dayJsformat(dateRange?.[0]!),
      end_date: dayJsformat(dateRange?.[1]!),
      target: target!,
      target_system: target_system!,
      recordJson: json,
      headers: {},
      localStorages: [],
      report_name: report_name!,
      version: version!,
    });

    visible.value = false;
    emit('success');
    loading.value = false;
  } catch (e) {
    ElMessage.error(e as string);
    loading.value = false;
  }
};
</script>

<style lang="postcss" scoped></style>
