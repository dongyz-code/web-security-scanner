import path from 'path';
import { writeFile } from 'fs/promises';
import { dayJsformat, REPORT_DIR } from '@/configs/index.js';
import { WEB_SECURITY_LIBRARY, REPORT_TEMPLATE } from '../constant.js';
import { arrObject, fse } from '@m170/utils/node';
import {
  Document,
  Packer,
  Paragraph,
  Tab,
  TextRun,
  Header,
  TableOfContents,
  PageNumber,
  AlignmentType,
  TabStopType,
  TabStopPosition,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  LevelFormat,
} from 'docx';

import type { ScanResultMap } from '../type.js';
import type { FileChild, IParagraphStyleOptions, ISectionOptions, IStylesOptions } from 'docx';

enum SPACING {
  HEADING_SPACING = 480,
  BASE_SPACING = 240,
}

export enum ReportColor {
  YELLOW = 'FFC000',
  RED = 'FF0000',
}

/**
 * 生成封面
 * @returns
 */
async function generateCover() {
  const title = 'Web 安全扫描报告';
  const version = '1.0.0';

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
      /** 首页不显示页码 */
      first: new Header({
        children: [
          new Paragraph({
            children: [new TextRun({ text: `${title} ${version}` })],
            thematicBreak: true,
          }),
        ],
      }),
      default: new Header({
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: `${title} ${version}` }),
              new TextRun({
                children: [new Tab(), PageNumber.CURRENT],
              }),
            ],
            tabStops: [
              {
                type: TabStopType.RIGHT,
                position: TabStopPosition.MAX,
              },
            ],
            thematicBreak: true,
          }),
        ],
      }),
    },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: title,
            size: '24pt',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: {
          before: 240 * 15,
        },
        style: 'base',
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: version,
            size: '24pt',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: {
          before: 120,
        },
        style: 'base',
      }),
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
          before: SPACING.HEADING_SPACING,
          after: SPACING.HEADING_SPACING,
        },
      }),
      new TableOfContents('目录', {
        hyperlink: true,
        // headingStyleRange: '1-2',
      }),
    ],
  };

  return CATALOG;
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
export function generateTable({
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

export async function generateDocument(scanRes: ScanResultMap[]) {
  const webSecurityLibrary = arrObject(WEB_SECURITY_LIBRARY, 'v_type');
  const summaries: Paragraph[] = [];
  const details: FileChild[] = [];

  scanRes.forEach((item) => {
    const { v_type, failCount, failUrls, headers } = item;
    const { name, description, risk } = webSecurityLibrary[v_type];
    let status = '通过';

    if (failCount > 0) {
      status = '不通过';
      summaries.push(
        // new Paragraph({ children: [new TextRun({ text: `${name}` })], style: 'base' })
        new Paragraph({
          text: `[${risk}] ${name}`,
          heading: HeadingLevel.HEADING_2,
          numbering: {
            reference: 'catalog',
            level: 1,
          },
        })
      );
    }

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
        name: '漏洞及风险描述',
        description,
      },
      {
        name: status,
        description: Object.entries(headers)
          .map(([key, value]) => {
            return `${key}: ${value}`;
          })
          .join('\n'),
      },
    ];

    if (status === '不通过') {
      tableData.push({ name: 'URL', description: failUrls.slice(0, 3).join('\n') });
    }

    const tableColumns: TableColumn[] = [
      { label: '漏洞说明', key: 'name', width: '30%' },
      { label: '漏洞', key: 'description', width: '70%' },
    ];

    const TableInstance = generateTable({
      columns: tableColumns,
      data: tableData,
      showHeader: false,
    });

    details.push(TableInstance);

    // Object.entries(headers).forEach(([key, value]) => {
    //   header.push({ text: key });
    //   header.push({ text: value });
    // });
  });

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
        text: REPORT_TEMPLATE.SUMMARY_TEXT,
        data: {
          start_date: '2025-01-01',
          end_date: '2025-01-01',
          target_system: 'XXX系统',
          risk_total: 10,
          risk_high: 1,
          risk_medium: 2,
          risk_low: 3,
          risk_info: 4,
        },
        highlight: ['本次安全测试综合风险评级：低风险'],
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
      ...summaries,
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
        text: REPORT_TEMPLATE.REFERENCE_TEXT,
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
      new Paragraph({
        text: '脉络洞察安全服务团队的攻击和渗透方法是对测试范围内的资产进行全面，可重复和可审计的评估。这种测试方法通过模拟黑客入侵的方式识别Web应用程序相关的安全漏洞，并提供解决此类漏洞的建议。渗透测试通过以下七个步骤进行：',
      }),
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
      new Paragraph({
        text: '脉络洞察安全服务团队对漏洞评级依照《信息安全技术-网络安全漏洞分类分级指南 GB/T 30279-2020》进行，从访问路径、触发要求、权限需求、交互条件、保密性影响程度、完整性影响程度、可用性影响程度七个维度进行技术赋值，按照标准要求计算出漏洞技术分级结果，共包含：超危、高危、中危、低危四个漏洞评级。',
      }),
      new Paragraph({
        text: '漏洞评级详情请参考《信息安全技术-网络安全漏洞分类分级指南 GB/T 30279-2020》。',
      }),
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
          { level: '高风险', description: '存在1个及以上高危漏洞，或3个以上中危漏洞的系统' },
          { level: '中风险', description: '存在1个到3个中危漏洞，或5个以上低危漏洞的系统' },
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
      new Paragraph({
        text: '我们的测试方法需要使用商业扫描工具和开源/免费软件渗透测试工具。用于测试的工具（包括且不限）NMAP、Goby、SQLMAP、Wireshark、Metasploit等 ',
      }),
      new Paragraph({
        text: '在实施渗透的过程中，XXX安全服务团队会根据业务系统场景的不同，使用符合场景的脚本用于自动化测试。',
      }),
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
        text: '脉络洞察在本文档中提供的各项修复建议均为基于漏洞的原理性分析修复方案或应用厂商提供的通用性方案，脉络洞察无法完全了解系统研发详情，无法判断实际修复动作可能对业务造成的影响，对应建议仅供漏洞修复参考。',
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
      new Paragraph({
        text: '了解更多',
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
        text: '了解更多安全信息，或关于本文出现的漏洞、攻击方式等详细介绍与建议，可查看XXX安全中心的威胁维基或关注XXX科技公众号了解最新的安全情报。',
      }),
    ],
  } as ISectionOptions;
}

export async function generateWord(scanRes: ScanResultMap[]) {
  const now = new Date();
  const filename = `report-${dayJsformat(now, 'YYYYMMDDHHmmss')}`;
  const dir = path.join(REPORT_DIR);
  fse.ensureDirSync(dir);
  const outFile = path.join(dir, `${filename}.docx`);

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
            firstLine: 480 * i,
          },
        },
        run: {
          font: FONT,
          size: '12pt',
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
          size: '10pt',
          font: FONT,
        },
      },
      ...tocStyle(),
    ],
  };

  const [COVER, CATALOG, BODY] = await Promise.all([
    generateCover(),
    generateCatalog(),
    generateDocument(scanRes),
  ]);

  const doc = new Document({
    creator: '脉络洞察',
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
