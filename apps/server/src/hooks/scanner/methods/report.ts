import path from 'path';
import { dayJsformat, REPORT_DIR } from '@/configs/index.js';
import { WEB_SECURITY_LIBRARY } from '../constant.js';
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
  LineNumberRestartFormat,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from 'docx';

import { helperDocxOptions, type ScanResultMap } from '../type.js';
import type {
  IParagraphOptions,
  IParagraphStyleOptions,
  ISectionOptions,
  IStylesOptions,
} from 'docx';
import { writeFile } from 'fs/promises';

const HEADING_SPACING = 480;
export enum ReportColor {
  YELLOW = '#FFC000',
  RED = '#FF0000',
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
          before: HEADING_SPACING,
          after: HEADING_SPACING,
        },
      }),
      new TableOfContents('目录', {
        hyperlink: true,
        // headingStyleRange: "1-2",
      }),
    ],
  };

  return CATALOG;
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
    children: columns.map((column) => {
      return new TableCell({
        children: [new Paragraph({ text: column.label })],
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
          children: [...list.map((item) => new Paragraph({ text: item }))],
          width: {
            size: column.width,
            type: WidthType.PERCENTAGE,
          },
        });
      }),
    });
  });

  if (showHeader) {
    return new Table({
      rows: [Header, ...Body],
    });
  } else {
    return new Table({
      rows: [...Body],
    });
  }
}

export async function generateDocument(scanRes: ScanResultMap[]) {
  const webSecurityLibrary = arrObject(WEB_SECURITY_LIBRARY, 'v_type');
  const summaries: Paragraph[] = [];
  const details: Paragraph[] = [];

  scanRes.forEach((item) => {
    const { v_type, failCount, failUrls, headers } = item;
    const { name, description, risk } = webSecurityLibrary[v_type];
    let status = '通过';

    if (failCount > 0) {
      status = '不通过';
      summaries.push(new Paragraph({ children: [new TextRun({ text: `${name}` })] }));
    }

    const title = `[${status}] ${risk} ${name}`;
    details.push(
      new Paragraph({
        text: title,
        heading: HeadingLevel.HEADING_2,
        spacing: {
          after: HEADING_SPACING,
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
        description: '',
      },
    ];

    const tableColumns: TableColumn[] = [
      { label: '漏洞说明', key: 'description', width: '30%' },
      { label: '漏洞说明', key: 'description', width: '70%' },
    ];

    const TableInstance = generateTable({
      columns: tableColumns,
      data: tableData,
      showHeader: false,
    });

    details.push(
      new Paragraph({
        children: [TableInstance],
      })
    );

    // Object.entries(headers).forEach(([key, value]) => {
    //   header.push({ text: key });
    //   header.push({ text: value });
    // });
  });

  return {
    children: [
      new Paragraph({
        text: '3.问题总览',
        heading: HeadingLevel.HEADING_1,
        spacing: {
          after: HEADING_SPACING,
        },
      }),
      new Paragraph({
        children: summaries,
      }),

      new Paragraph({
        text: '4.测试用例',
        heading: HeadingLevel.HEADING_1,
        spacing: {
          after: HEADING_SPACING,
        },
      }),
      ...details,
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
          size: '12pt',
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
    styles,
    features: {
      updateFields: true,
    },
    sections: [COVER, CATALOG, BODY],
  });

  await writeFile(outFile, await Packer.toBuffer(doc));
}
