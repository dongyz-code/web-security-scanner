<template>
  <div class="w-full">
    <div class="bg-primary w-full bg-gray-100 p-2 text-base">渗透测试报告</div>

    <el-config-provider :locale="zhCn">
      <router-view>
        <template #default="{ Component }">
          <transition name="fade">
            <component :is="Component" />
          </transition>
        </template>
      </router-view>
    </el-config-provider>
  </div>
</template>

<script setup lang="ts">
// @ts-ignore
import zhCn from 'element-plus/dist/locale/zh-cn.mjs';
</script>

<style scoped></style>
