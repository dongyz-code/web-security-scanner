/**
 * https://docx.js.org/#/usage/
 *
 */

import {
  Document,
  Packer,
  Paragraph,
  Tab,
  TextRun,
  ImageRun,
  Header,
  TableOfContents,
  PageNumber,
  AlignmentType,
  TabStopType,
  TabStopPosition,
  HeadingLevel,
  LineNumberRestartFormat,
} from 'docx';
import { writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { imageSize } from 'image-size';
import { join, parse } from 'node:path';
import { fse, getDirname, getKeys } from '@m170/utils/node';

import type {
  IParagraphOptions,
  IParagraphStyleOptions,
  ISectionOptions,
  IStylesOptions,
} from 'docx';

type BodyItem = {
  title: string;
  detail: (
    | string
    | {
        list: string[];
      }
    | {
        image: string;
      }
  )[];
  children?: BodyItem[];
};

export type DocxData = {
  title: string;
  version: string;
  date: string;
  body: BodyItem[];
};

/** 构造数据
 *
 * 如图所示，图片会自动添加名称，故如果需要说明里引用图片，请使用 $$_图片名称 替代
 */
export function helperData(__dirname: string, data: DocxData) {
  const dir = getDirname(__dirname);

  const replace = (body: DocxData['body']) => {
    body.forEach((bodyItem) => {
      bodyItem.detail = bodyItem.detail.map((item) => {
        if (typeof item === 'object') {
          if ('image' in item) {
            item.image = join(dir, item.image);
          }
        }
        return item;
      });
      if (bodyItem.children) {
        replace(bodyItem.children);
      }
    });
  };

  replace(data.body);

  return data;
}

/** 标题空白区域大小 */
const HEADING_SPACING = 480;
/** const FONT = "sans-serif"; 暂不定义字体 */
const FONT = undefined;

export async function convert(data: DocxData, outFile: string) {
  const DATA = data;

  /** https://github.com/dolanmiu/docx/issues/435
   *
   * 目录样式
   */
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

  /** 整体样式 */
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

  /** 首页 */
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
            children: [new TextRun({ text: `${data.title} ${data.version}` })],
            thematicBreak: true,
          }),
        ],
      }),
      default: new Header({
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: `${data.title} ${data.version}` }),
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
            text: data.title,
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
            text: data.version,
            size: '24pt',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: {
          before: 120,
        },
        style: 'base',
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: data.date,
            size: '20pt',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: {
          before: 240 * 15,
        },
        style: 'base',
      }),
    ],
  };

  /** 目录 */
  const CATLOG: ISectionOptions = {
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

  const numMapping: Record<number, string> = {
    1: '一',
    2: '二',
    3: '三',
    4: '四',
    5: '五',
    6: '六',
    7: '七',
    8: '八',
    9: '九',
    10: '十',
  };

  /** 默认不超过 99 章 */
  const indexToChineseIndex = (val: number) => {
    if (val < 1 || val > 99) {
      throw new Error('非法参数');
    }
    if (val <= 10) {
      return numMapping[val];
    } else if (val < 20) {
      return `十${numMapping[val - 10]}`;
    } else {
      return `${numMapping[Math.floor(val / 10)]}十${val % 10 === 0 ? '' : numMapping[val % 10]}`;
    }
  };

  /** 正文 */
  const temp: ISectionOptions['children'] = [];
  const bodyChildren = [...temp];

  const add = (
    items?: DocxData['body'],
    {
      depth = 0,
      prefix = '',
    }: {
      prefix?: string;
      depth?: number;
    } = {}
  ) => {
    items?.forEach(({ title, detail, children }, index) => {
      const childPrefix = prefix ? `${prefix}${index + 1}.` : `${index + 1}.`;

      let imageIndex = 0;

      bodyChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text:
                depth === 0
                  ? `第${indexToChineseIndex(index + 1)}章 ${title}`
                  : `${prefix}${index + 1} ${title}`,
            }),
          ],
          heading: HeadingLevel[`HEADING_${depth + 1}` as keyof typeof HeadingLevel],
          spacing: {
            after: HEADING_SPACING,
          },
        })
      );

      /** detail 前后添加空白 */
      if (detail.length) {
        const imageMap: Record<string, string> = {};

        detail.forEach((val) => {
          if (typeof val === 'object' && 'image' in val) {
            imageIndex += 1;
            imageMap[val.image] = `图${childPrefix}${imageIndex}`.replace(/\./g, '-');
          }
        });

        const handleStr = (val: string) => {
          let str = val.replace(/\r +|\n + |\r\n +/g, '');
          getKeys(imageMap).forEach((key) => {
            str = str.replace(`$$_${parse(key).base}`, () => imageMap[key]);
          });
          return str;
        };

        detail.forEach((val, index) => {
          const addSpacing: (bool?: boolean) => IParagraphOptions = (bool) => {
            if (index === detail.length - 1 && bool !== false) {
              return {
                spacing: {
                  after: HEADING_SPACING,
                },
              };
            }
            return {};
          };

          if (typeof val === 'string') {
            bodyChildren.push(
              new Paragraph({
                style: 'base',
                children: [
                  new TextRun({
                    text: handleStr(val),
                  }),
                ],
                indent: {
                  firstLine: 480,
                },
                ...addSpacing(),
              })
            );
          } else if ('list' in val) {
            if (val.list.length) {
              /** 首个 PT, 末尾看是整体结束还是 */
              val.list.forEach((text, index) => {
                bodyChildren.push(
                  new Paragraph({
                    style: 'base',
                    children: [
                      new TextRun({
                        text: handleStr(text),
                      }),
                    ],
                    spacing: {
                      before: index === 0 ? HEADING_SPACING : 0,
                      after: index === val.list.length - 1 ? HEADING_SPACING : 0,
                    },
                    bullet: {
                      level: 0,
                    },
                  })
                );
              });
            }
          } else if ('image' in val) {
            if (!fse.pathExistsSync(val.image)) {
              throw new Error(`${DATA.title}  无效图片路径: ${val.image}`);
            }

            const imageBuffer = readFileSync(val.image);

            let { width = 0, height = 0 } = imageSize(imageBuffer);
            const MAX_WIDTH = 600;
            const MAX_HEIGHT = 600;

            if (width > MAX_WIDTH || height > MAX_HEIGHT) {
              const scale = Math.max(width / MAX_WIDTH, height / MAX_HEIGHT);
              width = Math.floor(width / scale);
              height = Math.floor(height / scale);
            }

            // bodyChildren.push(
            //   new Paragraph({
            //     children: [
            //       new ImageRun({
            //         data: imageBuffer,
            //         transformation: {
            //           width,
            //           height,
            //         },
            //         fallback: {
            //           type: 'png',
            //           data: imageBuffer,
            //         },
            //       }),
            //       new TextRun({
            //         text: imageMap[val.image],
            //       }),
            //     ],
            //     style: 'base',
            //     alignment: AlignmentType.CENTER,
            //     ...addSpacing(),
            //   })
            // );
          }
        });
      }

      add(children, {
        depth: depth + 1,
        prefix: childPrefix,
      });
    });
  };
  add(data.body);

  const BODY: ISectionOptions = {
    children: bodyChildren,
  };

  const doc = new Document({
    styles,
    features: {
      updateFields: true,
    },
    sections: [HOME, CATLOG, BODY],
  });

  await writeFile(outFile, await Packer.toBuffer(doc));
}
