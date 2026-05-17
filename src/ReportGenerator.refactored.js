export class ReportGenerator {
  constructor(database) {
    this.db = database;
  }

  static REPORT_TYPE = Object.freeze({
    CSV: 'CSV',
    HTML: 'HTML',
  });

  static ROLE = Object.freeze({
    ADMIN: 'ADMIN',
    USER: 'USER',
  });

  static PRIORITY_THRESHOLD = 1000;

  static USER_MAX_VISIBLE_VALUE = 500;

  generateReport(reportType, user, items) {
    const reportLines = [];
    const formatted = this.formatReport(reportType, user, items);

    reportLines.push(...formatted.lines);
    reportLines.push(...formatted.footer);

    return reportLines.join('').trim();
  }

  formatReport(reportType, user, items) {
    const header = this.buildHeader(reportType, user);

    let total = 0;
    const lines = [];

    for (const item of items) {
      if (!this.shouldIncludeItem(user, item)) {
        continue;
      }

      const isPriority = this.isPriorityItem(user, item);
      lines.push(this.formatItemLine(reportType, user, item, isPriority));
      total += item.value;
    }

    const footer = this.buildFooter(reportType, total);

    return {
      lines: [...header, ...lines],
      footer,
    };
  }

  buildHeader(reportType, user) {
    if (reportType === ReportGenerator.REPORT_TYPE.CSV) {
      return ['ID,NOME,VALOR,USUARIO\n'];
    }

    if (reportType === ReportGenerator.REPORT_TYPE.HTML) {
      return [
        '<html><body>\n',
        '<h1>Relatório</h1>\n',
        `<h2>Usuário: ${user.name}</h2>\n`,
        '<table>\n',
        '<tr><th>ID</th><th>Nome</th><th>Valor</th></tr>\n',
      ];
    }

    return [];
  }

  buildFooter(reportType, total) {
    if (reportType === ReportGenerator.REPORT_TYPE.CSV) {
      return ['\nTotal,,\n', `${total},,\n`];
    }

    if (reportType === ReportGenerator.REPORT_TYPE.HTML) {
      return ['</table>\n', `<h3>Total: ${total}</h3>\n`, '</body></html>\n'];
    }

    return [];
  }

  shouldIncludeItem(user, item) {
    if (user.role === ReportGenerator.ROLE.ADMIN) {
      return true;
    }

    if (user.role === ReportGenerator.ROLE.USER) {
      return item.value <= ReportGenerator.USER_MAX_VISIBLE_VALUE;
    }

    return false;
  }

  isPriorityItem(user, item) {
    return (
      user.role === ReportGenerator.ROLE.ADMIN &&
      item.value > ReportGenerator.PRIORITY_THRESHOLD
    );
  }

  formatItemLine(reportType, user, item, isPriority) {
    if (reportType === ReportGenerator.REPORT_TYPE.CSV) {
      return `${item.id},${item.name},${item.value},${user.name}\n`;
    }

    if (reportType === ReportGenerator.REPORT_TYPE.HTML) {
      const style = isPriority ? ' style="font-weight:bold;"' : '';
      return `<tr${style}><td>${item.id}</td><td>${item.name}</td><td>${item.value}</td></tr>\n`;
    }

    return '';
  }
}
