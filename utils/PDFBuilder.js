//data
export const C = {
    bg: "#0F172A",
    sidebar: "#1E293B",
    card: "#1E293B",
    accent: "#6366F1",
    accentLight: "#818CF8",
    accentPale: "#C7D2FE",
    border: "#334155",
    textPrimary: "#F1F5F9",
    textSecondary: "#94A3B8",
    textMuted: "#64748B",
    white: "#FFFFFF",
    green: "#10B981",
    gold: "#F59E0B",
    red: "#EF4444",
};

export const DIFFICULTY = {
    Beginner: { bg: "#D1FAE5", fg: "#059669", bar: C.green },
    Intermediate: { bg: "#FEF3C7", fg: "#D97706", bar: C.gold },
    Advanced: { bg: "#FFE4E6", fg: "#E11D48", bar: C.red },
};

export const RESOURCE_TYPE = {
    article: "#3B82F6",
    video: "#8B5CF6",
    course: "#EC4899",
    book: "#F97316",
};

export const LAYOUT = {
    paddingTop: 16,   // card top edge  →  circle centre
    circleR: 13,   // radius of step-number circle
    paddingBelowCircle: 14,   // circle bottom  →  divider line
    dividerToDesc: 12,   // divider line   →  first description line
    lineHeightDesc: 14,   // px per description line  (10pt font)
    lineHeightRes: 17,   // px per resource row
    paddingBottom: 16,   // last content   →  card bottom edge
};

export const PDF_SIZES = {
    pageWidth: 595.28,
    pageHeight: 841.89,
    marginX: 48,
    marginY: 48,
    contentWidth: 595.28 - 96,
};

export const LEVEL_COLORS = {
    Beginner: "#5DCAA5",
    Intermediate: "#818CF8",
    Advanced: "#C084FC",

};
export const PDF_FONTS = {
    heading: "Helvetica-Bold",
    body: "Helvetica",
    bold: "Helvetica-Bold",
};
export const PDF_COLORS = {
    bg: "#0F172A",
    surface: "#1E293B",
    surfaceLight: "#334155",
    accent: "#6366F1",
    accentSoft: "#818CF8",
    success: "#22C55E",
    warning: "#F59E0B",
    danger: "#EF4444",
    textPrimary: "#F8FAFC",
    textSecondary: "#94A3B8",
    textMuted: "#64748B",
    border: "#2D3E55",
};

export const roundedRect = (doc, x, y, w, h, r = 6) => {
    doc
        .moveTo(x + r, y)
        .lineTo(x + w - r, y)
        .quadraticCurveTo(x + w, y, x + w, y + r)
        .lineTo(x + w, y + h - r)
        .quadraticCurveTo(x + w, y + h, x + w - r, y + h)
        .lineTo(x + r, y + h)
        .quadraticCurveTo(x, y + h, x, y + h - r)
        .lineTo(x, y + r)
        .quadraticCurveTo(x, y, x + r, y)
        .closePath();
}

export const drawRoundedRect = (doc, x, y, w, h, r, fill, stroke = null) => {
    doc.save();
    doc.roundedRect(x, y, w, h, r);
    if (fill) doc.fillColor(fill);
    if (stroke) {
        doc.strokeColor(stroke).lineWidth(1);
        fill ? doc.fillAndStroke() : doc.stroke();
    } else {
        doc.fill();
    }
    doc.restore();
};

export const measureCardHeight = (doc, section, cardW) => {
    const { paddingTop, circleR, paddingBelowCircle,
        dividerToDesc, lineHeightDesc, lineHeightRes, paddingBottom } = LAYOUT;

    // Header zone
    const headerH = paddingTop + circleR * 2 + paddingBelowCircle;

    // Description — count wrapped lines
    doc.font("Helvetica").fontSize(10);
    const words = (section.description || "").split(" ");
    let line = "", lineCount = 0;
    for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (doc.widthOfString(test) < cardW - 60) {
            line = test;
        } else {
            lineCount++;
            line = word;
        }
    }
    if (line) lineCount++;
    const descH = lineCount * lineHeightDesc;

    // Resources
    const numRes = section.resources?.length || 0;
    const resH = numRes > 0 ? 8 + 13 + numRes * lineHeightRes : 0;

    return headerH + dividerToDesc + descH + resH + paddingBottom;
}

export const drawBackground = (doc) => {
    doc.rect(0, 0, 595, 842).fill(C.bg);
}

export const drawHeader = (doc, title, description) => {
    const HEADER_H = 130;

    // Background
    doc.rect(0, 0, 595, HEADER_H).fill(C.sidebar);

    // Left accent stripe
    doc.rect(0, 0, 5, HEADER_H).fill(C.accent);

    // Decorative ghost circles
    doc.save().opacity(0.06).circle(565, 18, 38).fill(C.accentLight).restore();
    doc.save().opacity(0.04).circle(525, 48, 28).fill(C.accentLight).restore();
    doc.save().opacity(0.05).circle(575, 78, 20).fill(C.accentLight).restore();

    // Title
    doc.font("Helvetica-Bold").fontSize(24).fillColor(C.textPrimary)
        .text(title, 25, 28, { lineBreak: false });

    // Underline accent
    const underlineW = Math.min(doc.widthOfString(title) + 4, 300);
    doc.moveTo(25, 55).lineTo(25 + underlineW, 55)
        .strokeColor(C.accent).lineWidth(2).stroke();

    // Description (max 2 lines)
    doc.font("Helvetica").fontSize(11).fillColor(C.textSecondary)
        .text(description, 25, 65, { width: 430, lineBreak: true });

    // "LEARNING PATH" badge
    const BW = 112, BH = 30;
    const BX = 595 - BW - 18, BY = 42;
    roundedRect(doc, BX, BY, BW, BH, 15);
    doc.fill(C.accent);
    doc.font("Helvetica-Bold").fontSize(10).fillColor(C.white)
        .text("LEARNING PATH", BX, BY + 9, { width: BW, align: "center" });

    // Bottom border
    doc.moveTo(0, HEADER_H).lineTo(595, HEADER_H)
        .strokeColor(C.border).lineWidth(1).stroke();
}

export const drawFooter = (doc, title, pageNum = 1) => {
    const Y = 812;
    doc.moveTo(25, Y).lineTo(570, Y).strokeColor(C.border).lineWidth(0.5).stroke();
    doc.font("Helvetica").fontSize(8).fillColor(C.textMuted)
        .text(title, 25, Y + 6, { lineBreak: false })
        .text(`Page ${pageNum}`, 25, Y + 6, { width: 545, align: "right" });
}

export const drawConnector = (doc, x, fromY, toY) => {
    doc.save()
        .moveTo(x, fromY).lineTo(x, toY)
        .strokeColor(C.accent).opacity(0.35).lineWidth(1.5)
        .dash(3, { space: 4 }).stroke()
        .restore();
}

export const drawSectionCard = (doc, section, index, x, cardTop, cardW) => {
    const {
        paddingTop, circleR, paddingBelowCircle,
        dividerToDesc, lineHeightDesc, lineHeightRes, paddingBottom,
    } = LAYOUT;

    const cardH = measureCardHeight(doc, section, cardW);
    const cardBottom = cardTop + cardH;              // PDFKit: y grows downward
    const diff = section.difficulty || "Beginner";
    const dk = DIFFICULTY[diff] || DIFFICULTY.Beginner;

    // ── Shadow ────────────────────────────────────────────────────────────────
    doc.save().opacity(0.2)
        .rect(x + 3, cardTop + 3, cardW, cardH).fill("#000000")
        .restore();

    // ── Card background ───────────────────────────────────────────────────────
    roundedRect(doc, x, cardTop, cardW, cardH, 8);
    doc.fill(C.card);

    // ── Left difficulty bar ───────────────────────────────────────────────────
    roundedRect(doc, x, cardTop, 4, cardH, 2);
    doc.fill(dk.bar);

    // ── Step-number circle ────────────────────────────────────────────────────
    //  circle_cy = cardTop + paddingTop + circleR  (single source of truth)
    const CX = x + 28;
    const CY = cardTop + paddingTop + circleR;

    doc.circle(CX, CY, circleR).fill(C.accent);
    doc.font("Helvetica-Bold").fontSize(11).fillColor(C.white)
        .text(String(index + 1), CX - circleR, CY - 6, { width: circleR * 2, align: "center" });

    // ── Section title (optically aligned to circle centre) ────────────────────
    //  cap-height of 13pt ≈ 9pt  →  top of text = CY - 4.5  →  use CY - 5
    doc.font("Helvetica-Bold").fontSize(13).fillColor(C.textPrimary)
        .text(section.title, CX + circleR + 10, CY - 9, { lineBreak: false });

    // ── Difficulty badge (vertically centred on CY) ───────────────────────────
    const BADGE_H = 16;
    doc.font("Helvetica-Bold").fontSize(8);
    const badgeW = doc.widthOfString(diff) + 16;
    const BX = x + cardW - badgeW - 14;
    const BY = CY - BADGE_H / 2;
    roundedRect(doc, BX, BY, badgeW, BADGE_H, 8);
    doc.fill(dk.bg);
    doc.font("Helvetica-Bold").fontSize(8).fillColor(dk.fg)
        .text(diff, BX, BY + 4, { width: badgeW, align: "center" });

    // ── Divider (derived from circle bottom) ─────────────────────────────────
    //  divider_y = CY + circleR + paddingBelowCircle
    const dividerY = CY + circleR + paddingBelowCircle;
    doc.moveTo(x + 12, dividerY).lineTo(x + cardW - 12, dividerY)
        .strokeColor(C.border).lineWidth(0.5).stroke();

    // ── Description ───────────────────────────────────────────────────────────
    let curY = dividerY + dividerToDesc;
    doc.font("Helvetica").fontSize(10).fillColor(C.textSecondary);
    const words = (section.description || "").split(" ");
    let line = "", lineCount = 0;
    for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (doc.widthOfString(test) < cardW - 60) {
            line = test;
        } else {
            doc.text(line, x + 18, curY + lineCount * lineHeightDesc, { lineBreak: false });
            lineCount++;
            line = word;
        }
    }
    if (line) {
        doc.text(line, x + 18, curY + lineCount * lineHeightDesc, { lineBreak: false });
        lineCount++;
    }

    // ── Resources ─────────────────────────────────────────────────────────────
    const resources = section.resources || [];
    let resY = curY + lineCount * lineHeightDesc + 8;

    if (resources.length > 0) {
        doc.font("Helvetica-Bold").fontSize(8).fillColor(C.textMuted)
            .text("RESOURCES", x + 18, resY, { lineBreak: false });
        resY += 13;

        for (const res of resources) {
            const rtype = (res.type || "article").toLowerCase();
            const tc = RESOURCE_TYPE[rtype] || C.accentLight;
            const label = rtype.toUpperCase();
            doc.font("Helvetica-Bold").fontSize(7);
            const pillW = doc.widthOfString(label) + 10;

            // Pill background
            roundedRect(doc, x + 18, resY - 2, pillW, 13, 6);
            doc.fill(tc);

            // Pill label
            doc.font("Helvetica-Bold").fontSize(7).fillColor(C.white)
                .text(label, x + 18, resY + 2, { width: pillW, align: "center" });

            // Resource title
            doc.font("Helvetica").fontSize(9).fillColor(C.accentLight)
                .text(res.title || "", x + 18 + pillW + 6, resY + 2, { lineBreak: false });

            resY += lineHeightRes;
        }
    }

    return cardBottom;
}