import path from 'path';
import { writeFile } from 'fs/promises';
import { dayJsformat, REPORT_DIR } from '@/configs/index.js';
import { arrObject, fse } from '@m170/utils/node';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Header,
  TableOfContents,
  AlignmentType,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  LevelFormat,
} from 'docx';
import {
  WEB_SECURITY_LIBRARY,
  REPORT_DEFAULT_INFO,
  RISK_LEVEL_MAP,
  RiskLevel,
  TOTAL_RISK_LEVEL_MAP,
} from '../constant.js';

import type { ScanResultMap } from '../type.js';
import type {
  FileChild,
  IParagraphOptions,
  IParagraphStyleOptions,
  ISectionOptions,
  IStylesOptions,
} from 'docx';
import type { LaunchForm } from '@/types/index.js';

enum SPACING {
  HEADING_SPACING = 480,
  BASE_SPACING = 240,
}

enum ReportColor {
  YELLOW = 'FFC000',
  RED = 'FF0000',
}

enum TEXT_SIZE {
  BASE = '14pt',
  H1 = '24pt',
  H2 = '22pt',
  H3 = '20pt',
  H4 = '18pt',
  H5 = '16pt',
}

/** -------------------------method---------------------------------- */

function baseParagraph(text: string, option?: IParagraphOptions) {
  return new Paragraph({
    text,
    style: 'base',
    spacing: {
      after: SPACING.BASE_SPACING,
    },
    ...option,
  });
}

function baseTableParagraph(text: string, option?: IParagraphOptions) {
  return new Paragraph({
    text,
    style: 'base',
    ...option,
  });
}

/** 根据text生成段落, 支持变量替换，高亮字段，自动换行 */
function generateHighlightParagraph({
  text,
  data = {},
  highlight = [],
}: {
  text: string;
  data?: Record<string, any>;
  highlight?: string[];
}) {
  // 替换文本中的变量占位符
  let interpolatedText = text;
  for (const key in data) {
    interpolatedText = interpolatedText.replace(new RegExp(`{{${key}}}`, 'g'), data[key]);
  }

  // 分割文本为单独的段落
  const paragraphs = interpolatedText.split('\n').filter((item) => item.trim());

  return paragraphs.map((paragraphText) => {
    const paragraph = new Paragraph({ style: 'base', spacing: { after: SPACING.BASE_SPACING } });
    const regex = new RegExp(`(${highlight.join('|')})`, 'gi');
    const textPieces = paragraphText.split(regex);

    textPieces.forEach((piece) => {
      const isHighlight = highlight.some((h) => new RegExp(h, 'i').test(piece));

      const textRun = new TextRun({
        text: piece,
        bold: isHighlight,
        color: isHighlight ? ReportColor.RED : undefined,
      });

      paragraph.addChildElement(textRun);
    });

    return paragraph;
  });
}

/** 根据表格生成Paragraph */
type TableColumn = {
  label: string;
  key: string;
  width: `${number}%`;
};
function generateTable({
  columns,
  data,
  showHeader = true,
}: {
  columns: TableColumn[];
  data: Record<string, any>[];
  showHeader?: boolean;
}) {
  const Header = new TableRow({
    tableHeader: true,
    children: columns.map((column) => {
      return new TableCell({
        children: [new Paragraph({ text: column.label, style: 'base' })],
        width: {
          size: column.width,
          type: WidthType.PERCENTAGE,
        },
      });
    }),
  });

  const Body = data.map((item) => {
    return new TableRow({
      children: columns.map((column) => {
        const value = item[column.key].toString() as string;
        const list = value.split('\n').filter((item) => item.trim());

        return new TableCell({
          children: list.map((item) => new Paragraph({ text: item, style: 'base' })),
          width: {
            size: column.width,
            type: WidthType.PERCENTAGE,
          },
        });
      }),
    });
  });

  const rows: TableRow[] = [];

  if (showHeader) {
    rows.push(Header);
  }

  rows.push(...Body);

  return new Table({ rows, width: { size: '100%', type: WidthType.PERCENTAGE } });
}

/** 根据风险等级统计最终风险级别 */
function getRiskTotal(riskLevelCount: Record<RiskLevel, number>): RiskLevel {
  if (riskLevelCount.risk_critical > 0) {
    return 'risk_critical';
  }
  if (riskLevelCount.risk_high > 0 || riskLevelCount.risk_medium > 3) {
    return 'risk_high';
  }
  if (riskLevelCount.risk_medium > 1 || riskLevelCount.risk_low > 5) {
    return 'risk_medium';
  }
  return 'risk_low';
}

/** -------------------------method---------------------------------- */

/**
 * 生成封面
 * @returns
 */
async function generateCover({ report_name, version }: LaunchForm) {
  const HOME: ISectionOptions = {
    /** 首页不算页码 */
    properties: {
      titlePage: true,
      page: {
        pageNumbers: {
          start: 0,
        },
      },
    },
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            children: [new TextRun({ text: `${report_name} ${version}` })],
            thematicBreak: true,
          }),
        ],
      }),
    },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: report_name,
            size: TEXT_SIZE.H1,
            bold: true,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: {
          before: SPACING.BASE_SPACING * 25,
          after: SPACING.HEADING_SPACING,
        },
        style: 'base',
      }),

      new Table({
        width: { size: '80%', type: WidthType.PERCENTAGE },
        alignment: AlignmentType.CENTER,
        style: 'base',
        rows: [
          new TableRow({
            height: { value: '48pt', rule: 'atLeast' },

            children: [
              new TableCell({
                verticalAlign: AlignmentType.CENTER,
                children: [baseTableParagraph('测试时间')],
                width: { size: '40%' },
              }),
              new TableCell({
                verticalAlign: AlignmentType.CENTER,
                children: [baseTableParagraph(dayJsformat())],
                width: { size: '60%' },
              }),
            ],
          }),
        ],
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: '文档说明',
            size: TEXT_SIZE.H5,
            bold: true,
          }),
        ],
        /** 确保该段落从新页面开始 */
        pageBreakBefore: true,
        alignment: AlignmentType.CENTER,
        spacing: {
          before: SPACING.BASE_SPACING,
          after: SPACING.BASE_SPACING,
        },
        style: 'base',
      }),
      new Table({
        width: { size: '100%', type: WidthType.PERCENTAGE },
        columnWidths: [20, 30, 20, 30],
        style: 'base',
        rows: [
          new TableRow({
            height: { value: '24pt', rule: 'atLeast' },
            children: [
              new TableCell({
                children: [baseTableParagraph('文档名称')],
                width: { size: '20%' },
              }),
              new TableCell({
                children: [baseTableParagraph(report_name)],
                width: { size: '30%' },
                columnSpan: 3,
              }),
            ],
          }),
          new TableRow({
            height: { value: '24pt', rule: 'atLeast' },
            children: [
              new TableCell({
                children: [baseTableParagraph('文档管理编号')],
                width: { size: '20%' },
              }),
              new TableCell({
                children: [baseTableParagraph('SFSS-PT-R0001')],
                width: { size: '30%' },
                columnSpan: 3,
              }),
            ],
          }),
          new TableRow({
            height: { value: '24pt', rule: 'atLeast' },
            children: [
              new TableCell({
                children: [baseTableParagraph('保密级别')],
                width: { size: '20%' },
              }),
              new TableCell({
                children: [baseTableParagraph('商密')],
                width: { size: '30%' },
              }),
              new TableCell({
                children: [baseTableParagraph('文档版本号')],
                width: { size: '20%' },
              }),
              new TableCell({
                children: [baseTableParagraph(version)],
                width: { size: '30%' },
              }),
            ],
          }),
          new TableRow({
            height: { value: '24pt', rule: 'atLeast' },
            children: [
              new TableCell({
                children: [baseTableParagraph('制作人')],
                width: { size: '20%' },
              }),
              new TableCell({
                children: [baseTableParagraph(REPORT_DEFAULT_INFO.REPORT_CREATOR)],
                width: { size: '30%' },
              }),
              new TableCell({
                children: [baseTableParagraph('制作日期')],
                width: { size: '20%' },
              }),
              new TableCell({
                children: [baseTableParagraph(dayJsformat())],
                width: { size: '30%' },
              }),
            ],
          }),
          new TableRow({
            height: { value: '24pt', rule: 'atLeast' },
            children: [
              new TableCell({
                children: [baseTableParagraph('扩散范围')],
                width: { size: '20%' },
              }),
              new TableCell({
                children: [baseTableParagraph('限“脉络慧牍研发组”、脉络安全团队')],
                width: { size: '30%' },
                columnSpan: 3,
              }),
            ],
          }),
          new TableRow({
            height: { value: '24pt', rule: 'atLeast' },
            children: [
              new TableCell({
                children: [baseTableParagraph('分发控制')],
                width: { size: '20%' },
              }),
              new TableCell({
                children: [
                  baseTableParagraph('脉络安全团队：创建、修改、读取。'),
                  baseTableParagraph('脉络慧牍研发组：读取。'),
                ],
                width: { size: '30%' },
                columnSpan: 3,
              }),
            ],
          }),
        ],
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: '版本变更记录',
            size: TEXT_SIZE.H5,
            bold: true,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: {
          before: SPACING.BASE_SPACING,
          after: SPACING.BASE_SPACING,
        },
        style: 'base',
      }),
      generateTable({
        columns: [
          { label: '修改日期', key: 'date', width: '25%' },
          { label: '版本', key: 'version', width: '25%' },
          { label: '说明', key: 'description', width: '25%' },
          { label: '修改人', key: 'creator', width: '25%' },
        ],
        data: [
          {
            date: dayJsformat(),
            version: version,
            description: '正式版本',
            creator: REPORT_DEFAULT_INFO.REPORT_CREATOR,
          },
        ],
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: '适用范围',
            size: TEXT_SIZE.H5,
            bold: true,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: {
          before: SPACING.BASE_SPACING,
          after: SPACING.BASE_SPACING,
        },
        style: 'base',
      }),
      baseParagraph(
        '本次渗透测试是由脉络安全团队对脉络慧牍系统进行的安全风险深度评估，根据评估结果提交技术报告，用于对该网站系统的作出状况做出安全评估和加固建议，仅限于脉络内部人员传阅。'
      ),
      baseParagraph(
        '本报告结论的有效性建立在被测试单位提供相关证据的真实性基础之上。本报告中给出的评估结论仅对被评估的信息系统当时的安全状态有效，当信息系统发生涉及到的系统构成组件（或子系统）变更时本报告不再适用。'
      ),

      new Paragraph({
        children: [
          new TextRun({
            text: '版权声明',
            size: TEXT_SIZE.H5,
            bold: true,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: {
          before: SPACING.BASE_SPACING,
          after: SPACING.BASE_SPACING,
        },
        style: 'base',
      }),
      baseParagraph(
        '本文中出现的任何文字叙述、文档格式、插图、照片、方法、过程等内容，除另有特别注明，版权均属脉络所有，受到有关产权及版权法保护。任何个人、机构未经脉络的书面授权许可，不得以任何方式复制或引用本文的任何片断。'
      ),
    ],
  };
  return HOME;
}

async function generateCatalog() {
  const CATALOG: ISectionOptions = {
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: '目    录',
            bold: true,
          }),
        ],
        style: 'base',
        spacing: {
          before: SPACING.BASE_SPACING,
          after: SPACING.BASE_SPACING,
        },
      }),
      new TableOfContents('目录', {
        hyperlink: true,
      }),
    ],
  };

  return CATALOG;
}

async function generateDocument(scanRes: ScanResultMap[], launchForm: LaunchForm) {
  const webSecurityLibrary = arrObject(WEB_SECURITY_LIBRARY, 'v_type');
  const summaries: { index: string; name: string; result: string }[] = [];
  const details: FileChild[] = [];

  const riskLevelCount = {
    risk_total: 0,
    risk_low: 0,
    risk_medium: 0,
    risk_high: 0,
    risk_critical: 0,
  };

  const getRiskText = (risk: RiskLevel) => {
    return RISK_LEVEL_MAP[risk] || risk;
  };

  scanRes.forEach((item, i) => {
    const { v_type, failCount, failUrls, errorHeaders, successHeaders } = item;
    const { name, description, risk } = webSecurityLibrary[v_type];
    let status = '通过';

    if (failCount > 0) {
      status = '不通过';
      riskLevelCount.risk_total++;
      riskLevelCount[risk] = riskLevelCount[risk] || 0;
      riskLevelCount[risk]++;
    }

    const riskText = getRiskText(risk);
    summaries.push({
      index: `${i + 1}`,
      name: `${name}`,
      result: `${status}`,
    });

    const title = `[${status}] ${name}`;
    details.push(
      new Paragraph({
        text: title,
        heading: HeadingLevel.HEADING_2,
        numbering: {
          reference: 'catalog',
          level: 1,
        },
        spacing: {
          after: SPACING.HEADING_SPACING,
          before: SPACING.HEADING_SPACING,
        },
      })
    );

    const tableData = [
      {
        name: '风险级别',
        description: riskText,
      },
      {
        name: '漏洞及风险描述',
        description,
      },
      {
        name: status,
        description: Object.entries(failCount > 0 ? errorHeaders : successHeaders)
          .map(([key, value]) => {
            return `${key}: ${value}`;
          })
          .join('\n'),
      },
    ];

    if (status === '不通过') {
      tableData.push({ name: 'URL', description: failUrls.slice(0, 3).join('\n') });
    }

    const TableInstance = generateTable({
      columns: [
        { label: '漏洞说明', key: 'name', width: '30%' },
        { label: '漏洞', key: 'description', width: '70%' },
      ],
      data: tableData,
      showHeader: false,
    });

    details.push(TableInstance);
  });

  const riskTotal = getRiskTotal(riskLevelCount);
  const riskTotalText = `本次安全测试综合风险评级：${TOTAL_RISK_LEVEL_MAP[riskTotal]}`;

  return {
    properties: {},
    children: [
      new Paragraph({
        text: '摘要',
        heading: HeadingLevel.HEADING_1,
        spacing: {
          after: SPACING.HEADING_SPACING,
          before: SPACING.HEADING_SPACING,
        },
      }),
      ...generateHighlightParagraph({
        text: `
  脉络洞察安全服务团队于{{start_date}}至{{end_date}}，对{{target_system}}进行了全面的渗透测试。测试手段主要通过模拟黑客攻击手法对{{target_system}}开展测试并发现安全隐患；本次安全测试共发现了{{risk_total}}个安全漏洞，按漏洞风险分布为：高风险{{risk_high}}个，中风险{{risk_medium}}个，低风险{{risk_low}}个。
  {{risk_total_text}}
  从本次渗透测试结果来看，{{target_system}}在安全防护方面达到高级别。
  建议继续保持，进一步提高网络安全防护和管理水平：
  a.	在安全防护方面，建议完善安全基线并全面进行安全加固；加强办公终端管控，完善办公网络数据安全保护措施。
  b.	在威胁发现方面，建议进一步加强APT攻击检测和威胁监测能力，加强日常安全检查力度，完善等级保护和风险评估机制，对安全加固和防护效果定期进行检查和评估，及时识别和消除风险。
  c.	在安全管理方面，建议继续加强全体系信息安全工作的整体管理和组织协调，强化人员安全意识，严格落实各项规章制度，继续加强安全开发和上线前安全测试工作，不断提升运维管理水平。
  `,
        data: {
          start_date: launchForm.start_date,
          end_date: launchForm.end_date,
          target_system: launchForm.target_system,
          risk_total_text: riskTotalText,
          ...riskLevelCount,
        },
        highlight: [`${riskTotalText}`],
      }),

      new Paragraph({
        text: '渗透测试说明',
        heading: HeadingLevel.HEADING_1,
        numbering: {
          reference: 'catalog',
          level: 0,
        },
        spacing: {
          after: SPACING.HEADING_SPACING,
          before: SPACING.HEADING_SPACING,
        },
      }),
      new Paragraph({
        text: '测试时间',
        heading: HeadingLevel.HEADING_2,
        numbering: {
          reference: 'catalog',
          level: 1,
        },
        spacing: {
          after: SPACING.HEADING_SPACING,
        },
      }),
      baseParagraph('本次渗透测试按照事先约定规避风险的时间段开展，如下所示：'),

      new Table({
        width: { size: '100%' },
        style: 'base',
        alignment: 'center',
        rows: [
          new TableRow({
            tableHeader: true,
            height: { value: '24pt', rule: 'atLeast' },
            children: [
              new TableCell({
                children: [baseTableParagraph('测试工作时间段', { alignment: 'center' })],
                columnSpan: 4,
                verticalAlign: 'center',
              }),
            ],
          }),
          new TableRow({
            height: { value: '24pt', rule: 'atLeast' },
            children: [
              new TableCell({
                children: [baseTableParagraph('开始时间')],
                width: { size: '25%' },
              }),
              new TableCell({
                children: [baseTableParagraph(launchForm.start_date)],
                width: { size: '25%' },
              }),
              new TableCell({
                children: [baseTableParagraph('结束时间')],
                width: { size: '25%' },
              }),
              new TableCell({
                children: [baseTableParagraph(launchForm.end_date)],
                width: { size: '25%' },
              }),
            ],
          }),
        ],
      }),

      new Paragraph({
        text: '测试人员',
        heading: HeadingLevel.HEADING_2,
        numbering: {
          reference: 'catalog',
          level: 1,
        },
        spacing: {
          after: SPACING.HEADING_SPACING,
          before: SPACING.HEADING_SPACING,
        },
      }),
      baseParagraph('本次渗透测试实施人员，如下所示：'),
      new Table({
        width: { size: '100%' },
        style: 'base',
        rows: [
          new TableRow({
            tableHeader: true,
            height: { value: '24pt', rule: 'atLeast' },
            children: [
              new TableCell({
                children: [baseTableParagraph('测试人员名单', { alignment: 'center' })],
                columnSpan: 6,
              }),
            ],
          }),
          new TableRow({
            height: { value: '24pt', rule: 'atLeast' },
            children: [
              new TableCell({
                children: [baseTableParagraph('姓名')],
                width: { size: '16.67%' },
              }),
              new TableCell({
                children: [baseTableParagraph(' ')],
                width: { size: '16.67%' },
              }),
              new TableCell({
                children: [baseTableParagraph('测试IP')],
                width: { size: '16.67%' },
              }),
              new TableCell({
                children: [baseTableParagraph('')],
                width: { size: '16.67%' },
              }),
              new TableCell({
                children: [baseTableParagraph('联系方式')],
                width: { size: '16.67%' },
              }),
              new TableCell({
                children: [baseTableParagraph('')],
                width: { size: '16.67%' },
              }),
            ],
          }),
        ],
      }),

      new Paragraph({
        text: '问题总览',
        heading: HeadingLevel.HEADING_1,
        numbering: {
          reference: 'catalog',
          level: 0,
        },
        spacing: {
          after: SPACING.HEADING_SPACING,
          before: SPACING.HEADING_SPACING,
        },
      }),
      new Paragraph({
        text: '风险总览',
        heading: HeadingLevel.HEADING_2,
        numbering: {
          reference: 'catalog',
          level: 1,
        },
        spacing: {
          after: SPACING.HEADING_SPACING,
        },
      }),

      baseParagraph('本次渗透测试共发现漏洞如下：'),

      generateTable({
        columns: [
          { label: '编号', key: 'index', width: '20%' },
          { label: '应用系统名称', key: 'name', width: '40%' },
          { label: '结果', key: 'result', width: '40%' },
        ],
        data: [
          {
            index: '1',
            name: launchForm.target_system,
            result: `超危${riskLevelCount.risk_critical}个\n高危${riskLevelCount.risk_high}个\n中危${riskLevelCount.risk_medium}个\n低危${riskLevelCount.risk_low}个`,
          },
        ],
      }),

      new Paragraph({
        text: '漏洞概况',
        heading: HeadingLevel.HEADING_2,
        numbering: {
          reference: 'catalog',
          level: 1,
        },
        spacing: {
          after: SPACING.HEADING_SPACING,
        },
      }),
      baseParagraph('本次渗透测试主要覆盖的漏洞摘要如下表所示：'),
      generateTable({
        columns: [
          { label: '编号', key: 'index', width: '10%' },
          { label: '测试用例', key: 'name', width: '70%' },
          { label: '结果', key: 'result', width: '20%' },
        ],
        data: summaries,
      }),

      new Paragraph({
        text: '测试用例',
        heading: HeadingLevel.HEADING_1,
        numbering: {
          reference: 'catalog',
          level: 0,
        },
        spacing: {
          after: SPACING.HEADING_SPACING,
          before: SPACING.HEADING_SPACING,
        },
      }),
      ...details,
      new Paragraph({
        text: '渗透测试依据和参考',
        heading: HeadingLevel.HEADING_1,
        numbering: {
          reference: 'catalog',
          level: 0,
        },
        spacing: {
          after: SPACING.HEADING_SPACING,
          before: SPACING.HEADING_SPACING,
        },
      }),
      ...generateHighlightParagraph({
        text: `
  脉络洞察将参考下列国内、国际及脉络洞察制定的相关标准或规范指导渗透测试工作。
国内标准、指南或规范：
《计算机信息系统 安全保护等级划分准则》GB17859-1999
《信息安全技术 信息安全风险评估规范》GB/T 20984-2007
《信息安全技术 信息系统灾难恢复规范》GB/T 20988-2007
《信息安全技术 安全漏洞等级划分指南》GB/T 30279-2020
《信息安全技术 信息安全风险评估实施指南》GB/T 31509-2015
《信息安全技术 网络安全等级保护实施指南》GB/T 25058-2019
《信息安全技术 网络安全等级保护基本要求》GB/T 22239-2019
《信息安全技术 网络安全等级保护测评要求》GB/T 28448-2019
《信息技术 安全技术 安全保证框架 第1部分：介绍和概念》ISO/IEC TR 15443-1:2012
《信息技术 安全技术 安全保证框架 第2部分：分析》ISO/IEC TR 15443-2:2012
《信息技术 安全技术 运行系统安全评估》ISO/IEC TR 19791:2010
《信息技术 安全技术 信息安全风险管理》ISO/IEC 27005:2018
OWASP OWASP_Testing_Guide_v4
OWASP OWASP_Development_Guide_2005
OWASP OWASP_Top_10_2021_Chinese
  `,
      }),
      new Paragraph({
        text: '渗透测试工作说明',
        heading: HeadingLevel.HEADING_1,
        numbering: {
          reference: 'catalog',
          level: 0,
        },
        spacing: {
          after: SPACING.HEADING_SPACING,
          before: SPACING.HEADING_SPACING,
        },
      }),
      new Paragraph({
        text: '测试方法',
        heading: HeadingLevel.HEADING_2,
        numbering: {
          reference: 'catalog',
          level: 1,
        },
        spacing: {
          after: SPACING.HEADING_SPACING,
        },
      }),
      baseParagraph(
        '脉络洞察安全服务团队的攻击和渗透方法是对测试范围内的资产进行全面，可重复和可审计的评估。这种测试方法通过模拟黑客入侵的方式识别Web应用程序相关的安全漏洞，并提供解决此类漏洞的建议。渗透测试通过以下七个步骤进行：'
      ),
      generateTable({
        columns: [
          { label: '编号', key: 'index', width: '10%' },
          { label: '测试步骤', key: 'text', width: '90%' },
        ],
        data: [
          { index: '1', text: '确定有关目标Web应用程序的详细信息' },
          { index: '2', text: '抓取目标Web应用程序并识别用户输入字段' },
          { index: '3', text: '了解正在运行的应用程序和服务' },
          { index: '4', text: '识别应用程序/操作系统的漏洞' },
          { index: '5', text: '验证漏洞，并且确定漏洞的风险' },
          { index: '6', text: '总结单个漏洞的风险和评级' },
          { index: '7', text: '总结整体系统的风险评级' },
        ],
      }),
      new Paragraph({
        text: '漏洞评级标准',
        heading: HeadingLevel.HEADING_2,
        numbering: {
          reference: 'catalog',
          level: 1,
        },
        spacing: {
          before: SPACING.HEADING_SPACING,
          after: SPACING.HEADING_SPACING,
        },
      }),
      baseParagraph(
        '脉络洞察安全服务团队对漏洞评级依照《信息安全技术-网络安全漏洞分类分级指南 GB/T 30279-2020》进行，从访问路径、触发要求、权限需求、交互条件、保密性影响程度、完整性影响程度、可用性影响程度七个维度进行技术赋值，按照标准要求计算出漏洞技术分级结果，共包含：超危、高危、中危、低危四个漏洞评级。'
      ),
      baseParagraph(
        '漏洞评级详情请参考《信息安全技术-网络安全漏洞分类分级指南 GB/T 30279-2020》。'
      ),

      new Paragraph({
        text: '综合风险评级标准',
        heading: HeadingLevel.HEADING_2,
        numbering: {
          reference: 'catalog',
          level: 1,
        },
        spacing: {
          before: SPACING.HEADING_SPACING,
          after: SPACING.HEADING_SPACING,
        },
      }),
      generateTable({
        columns: [
          { label: '风险级别', key: 'level', width: '30%' },
          { label: '说明', key: 'description', width: '70%' },
        ],
        data: [
          { level: '高高危', description: '存在1个及以上高危漏洞，或3个以上中危漏洞的系统' },
          { level: '中危险', description: '存在1个到3个中危漏洞，或5个以上低危漏洞的系统' },
          { level: '低风险', description: '存在5个及以内低危漏洞，或未检测到漏洞的系统' },
        ],
      }),
      new Paragraph({
        text: '测试工具',
        heading: HeadingLevel.HEADING_2,
        numbering: {
          reference: 'catalog',
          level: 1,
        },
        spacing: {
          before: SPACING.HEADING_SPACING,
          after: SPACING.HEADING_SPACING,
        },
      }),
      baseParagraph(
        '我们的测试方法需要使用商业扫描工具和开源/免费软件渗透测试工具。用于测试的工具（包括且不限）NMAP、Goby、SQLMAP、Wireshark、Metasploit等'
      ),
      baseParagraph(
        `在实施渗透的过程中，${REPORT_DEFAULT_INFO.REPORT_CREATOR}会根据业务系统场景的不同，使用符合场景的脚本用于自动化测试。`
      ),
      new Paragraph({
        text: '修复建议说明',
        heading: HeadingLevel.HEADING_2,
        numbering: {
          reference: 'catalog',
          level: 1,
        },
        spacing: {
          before: SPACING.HEADING_SPACING,
          after: SPACING.HEADING_SPACING,
        },
      }),
      new Paragraph({
        text: '脉络洞察在本文档中提供的各项修复建议均为基于漏洞的原理性分析修复方案或应用厂商提供的通用性方案。',
        spacing: {
          after: SPACING.BASE_SPACING,
        },
      }),
      new Paragraph({
        text: '脉络洞察建议客户在测试环境中进行漏洞修复的验证工作或在修复前做好备份，避免修复过程中因非预期的问题导致业务受到影响。',
      }),
      new Paragraph({
        text: '致谢',
        heading: HeadingLevel.HEADING_1,
        numbering: {
          reference: 'catalog',
          level: 0,
        },
        spacing: {
          before: SPACING.HEADING_SPACING,
          after: SPACING.HEADING_SPACING,
        },
      }),
      new Paragraph({
        text: '感谢您对脉络洞察的信任与支持，脉络洞察将一如既往地为您提供优质的服务。',
      }),
      new Paragraph({
        text: '意见反馈',
        heading: HeadingLevel.HEADING_1,
        numbering: {
          reference: 'catalog',
          level: 0,
        },
        spacing: {
          before: SPACING.HEADING_SPACING,
          after: SPACING.HEADING_SPACING,
        },
      }),
      new Paragraph({
        text: '您可以通过邮件对我们的测试提供反馈，您的宝贵意见将是我们改善工作的方向和服务的动力，我们定会认真对待，切实改进，在此对您的支持和帮助表示感谢！',
      }),
    ],
  } as ISectionOptions;
}

export async function generateWord({
  scanRes,
  launchForm,
}: {
  scanRes: ScanResultMap[];
  launchForm: LaunchForm;
}) {
  const dir = path.join(REPORT_DIR);
  fse.ensureDirSync(dir);
  const outFile = path.join(dir, `${launchForm.scan_id}.docx`);

  const FONT = undefined;
  const tocStyle = () => {
    const data: IParagraphStyleOptions[] = [];

    for (let i = 0; i < 5; i++) {
      const id = `toc ${i + 1}`;
      data.push({
        id,
        name: id,
        basedOn: 'Normal',
        next: 'Normal',
        paragraph: {
          spacing: {
            line: 360,
          },
          indent: {
            firstLine: 480 * (i + 1),
          },
        },
        run: {
          font: FONT,
          size: '10pt',
        },
      });
    }

    return data;
  };

  const styles: IStylesOptions = {
    default: {
      heading1: {
        run: {
          size: '16pt',
          bold: true,
          color: '000000',
          font: FONT,
        },
      },
      heading2: {
        run: {
          size: '14pt',
          bold: true,
          color: '000000',
          font: FONT,
        },
      },
      heading3: {
        run: {
          size: '12pt',
          bold: true,
          color: '000000',
          font: FONT,
        },
      },
      heading4: {
        run: {
          size: '12pt',
          bold: true,
          color: '000000',
          font: FONT,
        },
      },
    },
    paragraphStyles: [
      {
        id: 'base',
        basedOn: 'Normal',
        next: 'Normal',
        paragraph: {
          spacing: {
            /** line-height 1.5 */
            line: 360,
          },
        },
        run: {
          size: '12pt',
          font: FONT,
        },
      },
      ...tocStyle(),
    ],
  };

  const [COVER, CATALOG, BODY] = await Promise.all([
    generateCover(launchForm),
    generateCatalog(),
    generateDocument(scanRes, launchForm),
  ]);

  const doc = new Document({
    creator: REPORT_DEFAULT_INFO.REPORT_CREATOR,
    styles,
    features: {
      updateFields: true,
    },
    numbering: {
      config: [
        {
          reference: 'catalog',
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: '%1.',
            },
            {
              level: 1,
              format: LevelFormat.DECIMAL,
              text: '%1.%2',
            },
            {
              level: 2,
              format: LevelFormat.DECIMAL,
              text: '%1.%2.%3',
            },
          ],
        },
      ],
    },
    sections: [COVER, CATALOG, BODY],
  });

  await writeFile(outFile, await Packer.toBuffer(doc));
}
