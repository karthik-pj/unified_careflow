import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Check,
  Lock,
  Download,
  ArrowRight,
} from "lucide-react";
import careflowLogo from "@assets/CF_Logo_schattiert_1770733929107.png";
import jsPDF from "jspdf";

const ndaPages = [
  {
    title: "Definitions & Secrecy",
    content: [
      { type: "header" as const, text: "Mutual Non-disclosure Agreement" },
      {
        type: "parties" as const,
        text: `CareFlow Systems GmbH
Alter Wall 32
20457 Hamburg, Germany

("CareFlow")

and

("Contracting Party")`,
      },
      {
        type: "paragraph" as const,
        text: `CareFlow and Contracting Party are also referred to individually as "Party" and jointly as the "Parties" -`,
      },
      {
        type: "paragraph" as const,
        text: `CareFlow and the Contracting Party intend to exchange confidential information for the following purpose:`,
      },
      {
        type: "paragraph" as const,
        text: `Discussions around fundraising and therefore a potential collaboration`,
        italic: true,
      },
      { type: "paragraph" as const, text: `(hereinafter "Defined Purpose")` },
      { type: "section" as const, number: "1.", title: "Definitions" },
      {
        type: "clause" as const,
        number: "1.1",
        text: `"Confidential Information" within the meaning of this Agreement shall be all embodied, electronic or oral information and data of a Party or of a company affiliated with a Party, which is marked as confidential or which is not known or readily accessible either in its entirety or in its details or composition and in the confidentiality of which there is a legitimate interest (e.g. technical or business data, documents or know-how and possibly samples) and which one Party discloses to the other in connection with the Defined Purpose.`,
      },
      {
        type: "clause" as const,
        number: "1.2",
        text: `"Affiliated Companies" are such companies affiliated with the Parties within the meaning of Artt. 15 et seq. AktG (German Stock Corporation Act).`,
      },
      { type: "section" as const, number: "2.", title: "Secrecy" },
      {
        type: "clause" as const,
        number: "2.1",
        text: `The parties undertake to use Confidential Information only for the Defined Purpose, to treat it confidentially and, in addition to Clause 2.2, not to disclose it to third parties without the prior written consent of the other Party.`,
      },
      {
        type: "clause" as const,
        number: "2.2",
        text: `The Parties undertake to make the Confidential Information available to their employees, the employees of Affiliated Companies, their consultants, the consultants of Affiliated Companies and to subcontractors, however only if they require the Confidential Information for the Defined Purpose and are obliged to maintain confidentiality at least equivalent to this Agreement.`,
      },
      {
        type: "clause" as const,
        number: "2.3",
        text: `The Parties undertake to secure the Confidential Information against unauthorized access and unauthorized disclosure by third parties by taking appropriate confidentiality measures. This also includes taking technical and organizational security measures in line with the current state of the art.`,
      },
    ],
  },
  {
    title: "Exceptions & Duration",
    content: [
      { type: "section" as const, number: "3.", title: "Exceptions" },
      {
        type: "clause" as const,
        number: "3.1",
        text: `The confidentiality obligation under Article 2 of this Agreement shall not apply to such Confidential Information as the receiving Party can prove to:`,
      },
      {
        type: "list" as const,
        items: [
          "a) be apparent at the time of transmission by the respective transmitting Party,",
          "b) be in the possession of the receiving Party at the time of transmission by the respective transmitting Party and did not originate from the transmitting Party,",
          "c) have been brought to the attention of the public, by written publication or otherwise, without the involvement of the receiving Party,",
          "d) have been transmitted to the receiving Party by an authorized third party, who has not made such a transmission subject to confidentiality; and/or",
          "e) have developed the Confidential Information independently.",
        ],
      },
      {
        type: "clause" as const,
        number: "3.2",
        text: `An obligation to disclose Confidential Information due to law or judicial/official order remains unaffected. In this case, the respective receiving Party shall inform the other Party in writing without undue delay when it becomes aware of the existence of the specific legal obligation to disclose.`,
      },
      {
        type: "section" as const,
        number: "4.",
        title: "Duration of the confidentiality obligation",
      },
      {
        type: "paragraph" as const,
        text: `The term of this Agreement shall come into effect upon signature and shall remain effective for three (3) years.`,
      },
      {
        type: "paragraph" as const,
        text: `The obligation to keep the Confidential Information confidential shall remain unaffected by the end of this Agreement. It shall end five (5) years after the end of the term of this Agreement.`,
      },
    ],
  },
  {
    title: "Rights & Liability",
    content: [
      {
        type: "section" as const,
        number: "5.",
        title: "No transfer of rights, non-use for intellectual property rights",
      },
      {
        type: "clause" as const,
        number: "5.1",
        text: `Licenses or other rights of any kind, in particular rights regarding patents, registered designs, trademarks, copyrights and other industrial property rights, whether protected or unprotected, shall only be granted by this Agreement to the extent that this is absolutely necessary to achieve the purpose of this Agreement. No obligation to grant further rights arises from this Agreement. Neither Party shall convert Confidential Information received into industrial property rights.`,
      },
      {
        type: "clause" as const,
        number: "5.2",
        text: `If the receiving Party is provided with products or samples of products, e.g. for purpose of examinations or trials, it undertakes not to analyze or have analyzed these products or samples with regard to their method of manufacturing or their composition.`,
      },
      {
        type: "paragraph" as const,
        text: `If and to the extent that the results of such examination reveal information about the method of manufacturing or composition of the samples or products, such results shall be regarded as Confidential Information in the meaning of this agreement.`,
      },
      {
        type: "clause" as const,
        number: "5.3",
        text: `The Contracting Party shall not receive any source code of software. It shall not reverse engineer, decompile, disassemble or use other techniques to analyze the software itself or through third parties, nor shall it enable third parties to do so. The aforementioned measures are only permitted to the extent that they are absolutely necessary to establish the interoperability of the software with another computer program. For this purpose, only authorized users of the software or third parties acting on their behalf may analyze those parts of the software, whose analysis is absolutely necessary for the aforementioned purpose. An analysis is not to be performed, if the necessary information is readily available to the authorized user. Information obtained in this way may not be used for other purposes or passed on to third parties.`,
      },
      {
        type: "section" as const,
        number: "6.",
        title: "Gratuitousness/Disclaimer",
      },
      {
        type: "clause" as const,
        number: "6.1",
        text: `Confidential Information shall be provided free of charge.`,
      },
      {
        type: "clause" as const,
        number: "6.2",
        text: `Any liability regarding the accuracy, correctness, freedom from third party intellectual property rights, completeness and/or usability of the Confidential Information is excluded.`,
      },
    ],
  },
  {
    title: "Return, Law & Miscellaneous",
    content: [
      { type: "section" as const, number: "7.", title: "Return" },
      {
        type: "clause" as const,
        number: "7.1",
        text: `The respective transmitting Party shall be entitled to request in writing at any time that the receiving Party either returns or destroys the Confidential Information in embodied or electronic form as well as all copies, at the discretion of the transmitting Party. The receiving Party shall, within fourteen (14) days of receipt of the aforementioned request from the providing Party, either return the Confidential Information and all copies or confirm in writing that it will destroy the Confidential Information.`,
      },
      {
        type: "clause" as const,
        number: "7.2",
        text: `Sect. 7.1 shall not apply to routine back-up copies of electronic communications and to the extent that Confidential Information or copies thereof are required to be retained by law. Such copies of the Confidential Information shall be subject to the unlimited confidentiality obligation in accordance with the terms of this Agreement.`,
      },
      {
        type: "section" as const,
        number: "8.",
        title: "Applicable law/Jurisdiction",
      },
      {
        type: "clause" as const,
        number: "8.1",
        text: `This Agreement shall be governed by German law, excluding the references to other legal systems.`,
      },
      {
        type: "clause" as const,
        number: "8.2",
        text: `Exclusive place of jurisdiction is Hamburg.`,
      },
      { type: "section" as const, number: "9.", title: "Miscellaneous" },
      {
        type: "clause" as const,
        number: "9.1",
        text: `There are no verbal secondary agreements to this Agreement. Amendments and/or supplements to this Agreement must be made in writing. This also applies to the above written form requirement.`,
      },
      {
        type: "clause" as const,
        number: "9.2",
        text: `Should individual provisions of this Agreement be invalid, the validity of the remaining provisions shall not be affected thereby. In place of the invalid provision, a provision shall apply which comes as close as possible to what the Parties intended and or would have intended if they had been aware of the invalidity of the provision. The same applies to any gaps in the contract.`,
      },
      {
        type: "paragraph" as const,
        text: `Signature page follows`,
        italic: true,
      },
    ],
  },
];

function NdaPageContent({ page }: { page: (typeof ndaPages)[0] }) {
  return (
    <div className="space-y-3">
      {page.content.map((block, i) => {
        if (block.type === "header") {
          return (
            <h2
              key={i}
              className="text-lg font-bold text-center mb-4"
              style={{ color: "#1a2332", fontFamily: '"AA Stetica Medium", sans-serif' }}
            >
              {block.text}
            </h2>
          );
        }
        if (block.type === "parties") {
          return (
            <pre
              key={i}
              className="text-xs leading-relaxed text-center whitespace-pre-line"
              style={{ color: "#374151", fontFamily: "inherit" }}
            >
              {block.text}
            </pre>
          );
        }
        if (block.type === "paragraph") {
          return (
            <p
              key={i}
              className={`text-xs leading-relaxed ${"italic" in block && block.italic ? "italic font-medium" : ""}`}
              style={{ color: "#374151" }}
            >
              {block.text}
            </p>
          );
        }
        if (block.type === "section") {
          return (
            <h3 key={i} className="text-sm font-bold mt-4 mb-1" style={{ color: "#1a2332" }}>
              {"number" in block ? block.number : ""} {"title" in block ? block.title : ""}
            </h3>
          );
        }
        if (block.type === "clause") {
          return (
            <div key={i} className="flex gap-2 text-xs leading-relaxed" style={{ color: "#374151" }}>
              <span className="font-semibold flex-shrink-0" style={{ color: "#6B7280" }}>
                {"number" in block ? block.number : ""}
              </span>
              <p>{block.text}</p>
            </div>
          );
        }
        if (block.type === "list") {
          return (
            <div key={i} className="pl-8 space-y-1">
              {"items" in block &&
                block.items.map((item: string, j: number) => (
                  <p key={j} className="text-xs leading-relaxed" style={{ color: "#374151" }}>
                    {item}
                  </p>
                ))}
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}

function generateNdaPdf(sigData: {
  firstName: string;
  lastName: string;
  company: string;
  street: string;
  city: string;
  country: string;
  signatureText: string;
  initialsPage1: string;
  initialsPage2: string;
  initialsPage3: string;
  initialsPage4: string;
  signedAt: string;
}, userEmail: string) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 25;
  const contentWidth = pageWidth - margin * 2;
  let y = 30;

  function addWatermark() {
    doc.saveGraphicsState();
    const gState = new (doc as any).GState({ opacity: 0.06 });
    doc.setGState(gState);
    doc.setFontSize(10);
    doc.setTextColor(46, 92, 191);
    doc.setFont("helvetica", "normal");
    const watermarkText = `${userEmail}  |  CareFlow Confidential`;
    const spacing = 45;
    for (let wy = 30; wy < pageHeight - 10; wy += spacing) {
      for (let wx = -40; wx < pageWidth + 40; wx += 90) {
        doc.text(watermarkText, wx, wy, { angle: 35 });
      }
    }
    doc.restoreGraphicsState();
  }

  function addConfidentialHeader() {
    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180);
    doc.text("Confidential", margin, 12);
  }

  function addPageNumber(pageNum: number) {
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(String(pageNum), pageWidth / 2, 287, { align: "center" });
  }

  function addInitials(initials: string) {
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text(`Initials: ${initials}`, pageWidth - margin, 287, { align: "right" });
  }

  function checkPageBreak(needed: number): void {
    if (y + needed > 270) {
      addWatermark();
      doc.addPage();
      y = 25;
      addConfidentialHeader();
    }
  }

  function addSection(number: string, title: string) {
    checkPageBreak(12);
    y += 4;
    doc.setFontSize(10);
    doc.setTextColor(26, 35, 50);
    doc.setFont("helvetica", "bold");
    doc.text(`${number} ${title}`, margin, y);
    y += 6;
  }

  function addClause(number: string, text: string) {
    checkPageBreak(10);
    doc.setFontSize(9);
    doc.setTextColor(55, 65, 81);
    doc.setFont("helvetica", "normal");
    const numWidth = 10;
    doc.setFont("helvetica", "bold");
    doc.text(number, margin, y);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(text, contentWidth - numWidth);
    doc.text(lines, margin + numWidth, y);
    y += lines.length * 4.2 + 2;
  }

  function addParagraph(text: string, italic = false) {
    checkPageBreak(8);
    doc.setFontSize(9);
    doc.setTextColor(55, 65, 81);
    doc.setFont("helvetica", italic ? "italic" : "normal");
    const lines = doc.splitTextToSize(text, contentWidth);
    doc.text(lines, margin, y);
    y += lines.length * 4.2 + 2;
    doc.setFont("helvetica", "normal");
  }

  addConfidentialHeader();

  doc.setFontSize(16);
  doc.setTextColor(26, 35, 50);
  doc.setFont("helvetica", "bold");
  doc.text("Mutual Non-disclosure Agreement", pageWidth / 2, y, { align: "center" });
  y += 14;

  doc.setFontSize(9);
  doc.setTextColor(55, 65, 81);
  doc.setFont("helvetica", "normal");
  const careflowBlock = ["CareFlow Systems GmbH", "Alter Wall 32", "20457 Hamburg, Germany"];
  careflowBlock.forEach((line) => {
    doc.text(line, pageWidth / 2, y, { align: "center" });
    y += 4.5;
  });
  y += 2;
  doc.text('("CareFlow")', pageWidth / 2, y, { align: "center" });
  y += 8;
  doc.text("and", pageWidth / 2, y, { align: "center" });
  y += 8;

  const partyBlock = [
    sigData.company,
    sigData.street,
    `${sigData.city}, ${sigData.country}`,
    `${sigData.lastName}, ${sigData.firstName}`,
  ];
  partyBlock.forEach((line) => {
    doc.text(line, pageWidth / 2, y, { align: "center" });
    y += 4.5;
  });
  y += 2;
  doc.text('("Contracting Party")', pageWidth / 2, y, { align: "center" });
  y += 10;

  addParagraph(
    'CareFlow and Contracting Party are also referred to individually as "Party" and jointly as the "Parties" -'
  );
  addParagraph(
    "CareFlow and the Contracting Party intend to exchange confidential information for the following purpose:"
  );
  addParagraph("Discussions around fundraising and therefore a potential collaboration", true);
  addParagraph('(hereinafter "Defined Purpose")');

  addSection("1.", "Definitions");
  addClause(
    "1.1",
    '"Confidential Information" within the meaning of this Agreement shall be all embodied, electronic or oral information and data of a Party or of a company affiliated with a Party, which is marked as confidential or which is not known or readily accessible either in its entirety or in its details or composition and in the confidentiality of which there is a legitimate interest (e.g. technical or business data, documents or know-how and possibly samples) and which one Party discloses to the other in connection with the Defined Purpose.'
  );
  addClause(
    "1.2",
    '"Affiliated Companies" are such companies affiliated with the Parties within the meaning of Artt. 15 et seq. AktG (German Stock Corporation Act).'
  );

  addSection("2.", "Secrecy");
  addClause(
    "2.1",
    "The parties undertake to use Confidential Information only for the Defined Purpose, to treat it confidentially and, in addition to Clause 2.2, not to disclose it to third parties without the prior written consent of the other Party."
  );
  addClause(
    "2.2",
    "The Parties undertake to make the Confidential Information available to their employees, the employees of Affiliated Companies, their consultants, the consultants of Affiliated Companies and to subcontractors, however only if they require the Confidential Information for the Defined Purpose and are obliged to maintain confidentiality at least equivalent to this Agreement."
  );
  addClause(
    "2.3",
    "The Parties undertake to secure the Confidential Information against unauthorized access and unauthorized disclosure by third parties by taking appropriate confidentiality measures. This also includes taking technical and organizational security measures in line with the current state of the art."
  );

  addPageNumber(1);
  addInitials(sigData.initialsPage1);
  addWatermark();

  doc.addPage();
  y = 25;
  addConfidentialHeader();

  addSection("3.", "Exceptions");
  addClause(
    "3.1",
    "The confidentiality obligation under Article 2 of this Agreement shall not apply to such Confidential Information as the receiving Party can prove to:"
  );
  const exceptions = [
    "a) be apparent at the time of transmission by the respective transmitting Party,",
    "b) be in the possession of the receiving Party at the time of transmission by the respective transmitting Party and did not originate from the transmitting Party,",
    "c) have been brought to the attention of the public, by written publication or otherwise, without the involvement of the receiving Party,",
    "d) have been transmitted to the receiving Party by an authorized third party, who has not made such a transmission subject to confidentiality; and/or",
    "e) have developed the Confidential Information independently.",
  ];
  exceptions.forEach((ex) => {
    doc.setFontSize(9);
    doc.setTextColor(55, 65, 81);
    const lines = doc.splitTextToSize(ex, contentWidth - 15);
    doc.text(lines, margin + 15, y);
    y += lines.length * 4.2 + 1;
  });
  y += 2;
  addClause(
    "3.2",
    "An obligation to disclose Confidential Information due to law or judicial/official order remains unaffected. In this case, the respective receiving Party shall inform the other Party in writing without undue delay when it becomes aware of the existence of the specific legal obligation to disclose."
  );

  addSection("4.", "Duration of the confidentiality obligation");
  addParagraph(
    "The term of this Agreement shall come into effect upon signature and shall remain effective for three (3) years."
  );
  addParagraph(
    "The obligation to keep the Confidential Information confidential shall remain unaffected by the end of this Agreement. It shall end five (5) years after the end of the term of this Agreement."
  );

  addPageNumber(2);
  addInitials(sigData.initialsPage2);
  addWatermark();

  doc.addPage();
  y = 25;
  addConfidentialHeader();

  addSection("5.", "No transfer of rights, non-use for intellectual property rights");
  addClause(
    "5.1",
    "Licenses or other rights of any kind, in particular rights regarding patents, registered designs, trademarks, copyrights and other industrial property rights, whether protected or unprotected, shall only be granted by this Agreement to the extent that this is absolutely necessary to achieve the purpose of this Agreement. No obligation to grant further rights arises from this Agreement. Neither Party shall convert Confidential Information received into industrial property rights."
  );
  addClause(
    "5.2",
    "If the receiving Party is provided with products or samples of products, e.g. for purpose of examinations or trials, it undertakes not to analyze or have analyzed these products or samples with regard to their method of manufacturing or their composition."
  );
  addParagraph(
    "If and to the extent that the results of such examination reveal information about the method of manufacturing or composition of the samples or products, such results shall be regarded as Confidential Information in the meaning of this agreement."
  );
  addClause(
    "5.3",
    "The Contracting Party shall not receive any source code of software. It shall not reverse engineer, decompile, disassemble or use other techniques to analyze the software itself or through third parties, nor shall it enable third parties to do so. The aforementioned measures are only permitted to the extent that they are absolutely necessary to establish the interoperability of the software with another computer program. For this purpose, only authorized users of the software or third parties acting on their behalf may analyze those parts of the software, whose analysis is absolutely necessary for the aforementioned purpose. An analysis is not to be performed, if the necessary information is readily available to the authorized user. Information obtained in this way may not be used for other purposes or passed on to third parties."
  );

  addSection("6.", "Gratuitousness/Disclaimer");
  addClause("6.1", "Confidential Information shall be provided free of charge.");
  addClause(
    "6.2",
    "Any liability regarding the accuracy, correctness, freedom from third party intellectual property rights, completeness and/or usability of the Confidential Information is excluded."
  );

  addPageNumber(3);
  addInitials(sigData.initialsPage3);
  addWatermark();

  doc.addPage();
  y = 25;
  addConfidentialHeader();

  addSection("7.", "Return");
  addClause(
    "7.1",
    "The respective transmitting Party shall be entitled to request in writing at any time that the receiving Party either returns or destroys the Confidential Information in embodied or electronic form as well as all copies, at the discretion of the transmitting Party. The receiving Party shall, within fourteen (14) days of receipt of the aforementioned request from the providing Party, either return the Confidential Information and all copies or confirm in writing that it will destroy the Confidential Information."
  );
  addClause(
    "7.2",
    "Sect. 7.1 shall not apply to routine back-up copies of electronic communications and to the extent that Confidential Information or copies thereof are required to be retained by law. Such copies of the Confidential Information shall be subject to the unlimited confidentiality obligation in accordance with the terms of this Agreement."
  );

  addSection("8.", "Applicable law/Jurisdiction");
  addClause(
    "8.1",
    "This Agreement shall be governed by German law, excluding the references to other legal systems."
  );
  addClause("8.2", "Exclusive place of jurisdiction is Hamburg.");

  addSection("9.", "Miscellaneous");
  addClause(
    "9.1",
    "There are no verbal secondary agreements to this Agreement. Amendments and/or supplements to this Agreement must be made in writing. This also applies to the above written form requirement."
  );
  addClause(
    "9.2",
    "Should individual provisions of this Agreement be invalid, the validity of the remaining provisions shall not be affected thereby. In place of the invalid provision, a provision shall apply which comes as close as possible to what the Parties intended and or would have intended if they had been aware of the invalidity of the provision. The same applies to any gaps in the contract."
  );

  y += 4;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.text("Signature page follows", pageWidth / 2, y, { align: "center" });

  addPageNumber(4);
  addInitials(sigData.initialsPage4);
  addWatermark();

  doc.addPage();
  y = 30;
  addConfidentialHeader();

  doc.setFontSize(14);
  doc.setTextColor(26, 35, 50);
  doc.setFont("helvetica", "bold");
  doc.text("Signature Page", pageWidth / 2, y, { align: "center" });
  y += 16;

  const signedDate = new Date(sigData.signedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const colLeft = margin;
  const colRight = pageWidth / 2 + 5;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(26, 35, 50);
  doc.text("CareFlow Systems GmbH", colLeft, y);
  doc.text("Contracting Party", colRight, y);
  y += 8;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(55, 65, 81);
  doc.text(`Place/Date: Hamburg, ${signedDate}`, colLeft, y);
  doc.text(`Place/Date: ${sigData.city}, ${signedDate}`, colRight, y);
  y += 6;
  doc.text("Name: Dr. Oliver Bergmann", colLeft, y);
  doc.text(`Name: ${sigData.firstName} ${sigData.lastName}`, colRight, y);
  y += 6;
  doc.text("Title: CEO", colLeft, y);
  doc.text(`Organization: ${sigData.company}`, colRight, y);
  y += 12;

  doc.setDrawColor(180, 180, 180);
  doc.line(colLeft, y, colLeft + 65, y);
  doc.line(colRight, y, colRight + 65, y);
  y += 5;

  doc.setFont("helvetica", "italic");
  doc.setTextColor(100, 100, 100);
  doc.text("Signed digitally", colLeft, y);
  doc.setTextColor(46, 92, 191);
  doc.text(sigData.signatureText, colRight, y);
  y += 5;
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.setFont("helvetica", "normal");
  doc.text(`Digitally signed on ${signedDate}`, colRight, y);

  addWatermark();
  doc.save("CareFlow_MNDA_Signed.pdf");
}

export default function NdaSignPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(0);
  const [initials, setInitials] = useState(["", "", "", ""]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [company, setCompany] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [signatureText, setSignatureText] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [signed, setSigned] = useState(false);
  const [signedData, setSignedData] = useState<any>(null);

  const userQuery = useQuery<any>({
    queryKey: ["/api/auth/me"],
  });

  const ndaStatusQuery = useQuery<any>({
    queryKey: ["/api/nda/status"],
    retry: false,
  });

  const alreadySigned = ndaStatusQuery.data?.signed && ndaStatusQuery.data?.signature;

  const totalPages = ndaPages.length;
  const isLastPage = currentPage === totalPages - 1;
  const allInitialed = initials.every((v) => v.trim().length > 0);

  const signMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/nda/sign", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/nda/status"] });
      toast({ title: "NDA signed successfully" });
      setSigned(true);
      setSignedData({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        company: company.trim(),
        street: street.trim(),
        city: city.trim(),
        country: country.trim(),
        signatureText: signatureText.trim(),
        initialsPage1: initials[0].trim(),
        initialsPage2: initials[1].trim(),
        initialsPage3: initials[2].trim(),
        initialsPage4: initials[3].trim(),
        signedAt: data.signature?.signedAt || new Date().toISOString(),
      });
    },
    onError: (error: Error) => {
      toast({ title: "Error signing NDA", description: error.message, variant: "destructive" });
    },
  });

  function handleSign() {
    if (!firstName.trim() || !lastName.trim() || !company.trim()) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    if (!street.trim() || !city.trim() || !country.trim()) {
      toast({ title: "Please fill in the full address", variant: "destructive" });
      return;
    }
    if (!allInitialed) {
      toast({ title: "Please initial all pages before signing", variant: "destructive" });
      return;
    }
    if (!signatureText.trim()) {
      toast({ title: "Please enter your signature", variant: "destructive" });
      return;
    }
    if (!accepted) {
      toast({ title: "Please accept the agreement", variant: "destructive" });
      return;
    }

    signMutation.mutate({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      company: company.trim(),
      street: street.trim(),
      city: city.trim(),
      country: country.trim(),
      initialsPage1: initials[0].trim(),
      initialsPage2: initials[1].trim(),
      initialsPage3: initials[2].trim(),
      initialsPage4: initials[3].trim(),
      signatureText: signatureText.trim(),
    });
  }

  function handleDownload() {
    const data = signedData || (alreadySigned ? ndaStatusQuery.data.signature : null);
    if (data) {
      const email = userQuery.data?.username || "user@careflow.com";
      generateNdaPdf(data, email);
      apiRequest("POST", "/api/nda/download-log", {}).catch(() => {});
    }
  }

  function updateInitials(pageIdx: number, value: string) {
    const next = [...initials];
    next[pageIdx] = value;
    setInitials(next);
  }

  const canProceed = initials[currentPage].trim().length > 0;
  const showSuccess = signed || alreadySigned;

  if (showSuccess) {
    return (
      <div
        className="min-h-screen flex flex-col relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #2e5cbf 0%, #3a7fd4 25%, #4fb8d7 50%, #6ed4c8 75%, #7adbc8 100%)",
        }}
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute w-[800px] h-[800px] rounded-full -top-[300px] -left-[200px] opacity-15"
            style={{ background: "radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)" }}
          />
          <div
            className="absolute w-[600px] h-[600px] rounded-full -bottom-[200px] -right-[150px] opacity-10"
            style={{ background: "radial-gradient(circle, rgba(255,255,255,0.25) 0%, transparent 70%)" }}
          />
        </div>

        <header className="relative z-20 px-4 md:px-6 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <img src={careflowLogo} alt="CareFlow" className="h-10 w-auto drop-shadow-lg" data-testid="img-nda-logo" />
            </div>
            <div className="flex items-center gap-2 text-white/80 text-sm">
              <Lock className="w-4 h-4" />
              <span>Confidential</span>
            </div>
          </div>
        </header>

        <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8">
          <Card className="border-0 shadow-lg bg-white/95 backdrop-blur-md overflow-visible max-w-lg w-full" data-testid="card-nda-success">
            <CardContent className="p-8 text-center">
              <div
                className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #2e5cbf, #008ed3)" }}
              >
                <Check className="w-8 h-8 text-white" />
              </div>
              <h2
                className="text-xl font-bold mb-2"
                style={{ color: "#1a2332", fontFamily: '"AA Stetica Medium", sans-serif' }}
              >
                Agreement Signed
              </h2>
              <p className="text-sm mb-6" style={{ color: "#6B7280" }}>
                The Mutual Non-Disclosure Agreement has been signed successfully. You can download a copy for your records.
              </p>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  className="w-full"
                  data-testid="button-download-nda"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Signed NDA (PDF)
                </Button>
                <Button
                  onClick={() => setLocation("/dashboard")}
                  style={{ background: "linear-gradient(135deg, #2e5cbf, #008ed3)" }}
                  className="w-full text-white"
                  data-testid="button-continue-dashboard"
                >
                  Continue to Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>

        <footer className="relative z-20 text-center py-4">
          <p className="text-white/70 text-xs tracking-wide" data-testid="text-copyright">
            &copy;2026 CareFlow Systems GmbH &middot; V 2.0.0
          </p>
        </footer>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #2e5cbf 0%, #3a7fd4 25%, #4fb8d7 50%, #6ed4c8 75%, #7adbc8 100%)",
      }}
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute w-[800px] h-[800px] rounded-full -top-[300px] -left-[200px] opacity-15"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)" }}
        />
        <div
          className="absolute w-[600px] h-[600px] rounded-full -bottom-[200px] -right-[150px] opacity-10"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.25) 0%, transparent 70%)" }}
        />
      </div>

      <header className="relative z-20 px-4 md:px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <img src={careflowLogo} alt="CareFlow" className="h-10 w-auto drop-shadow-lg" data-testid="img-nda-logo" />
          </div>
          <div className="flex items-center gap-2 text-white/80 text-sm">
            <Lock className="w-4 h-4" />
            <span>Confidential</span>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center px-4 py-4">
        <div className="w-full max-w-3xl">
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-white/80" />
              <h1
                className="text-xl font-bold text-white"
                style={{ fontFamily: '"AA Stetica Medium", sans-serif' }}
                data-testid="text-nda-title"
              >
                Non-Disclosure Agreement
              </h1>
            </div>
            <p className="text-white/70 text-sm">
              Please review, initial each page, and sign to proceed
            </p>
          </div>

          <div className="mb-4">
            <Card className="border-0 shadow-md bg-white/90 backdrop-blur-md overflow-visible" data-testid="card-signer-info">
              <CardContent className="p-4">
                <p className="text-xs font-semibold mb-3" style={{ color: "#6B7280" }}>
                  Contracting Party Details
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium" style={{ color: "#374151" }}>First Name *</label>
                    <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" data-testid="input-nda-firstname" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium" style={{ color: "#374151" }}>Last Name *</label>
                    <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" data-testid="input-nda-lastname" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium" style={{ color: "#374151" }}>Company / Organization *</label>
                    <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Organization name" data-testid="input-nda-company" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium" style={{ color: "#374151" }}>Street *</label>
                    <Input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Street address" data-testid="input-nda-street" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium" style={{ color: "#374151" }}>City *</label>
                    <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" data-testid="input-nda-city" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium" style={{ color: "#374151" }}>Country *</label>
                    <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country" data-testid="input-nda-country" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {ndaPages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i)}
                  className={`w-8 h-8 rounded-full text-xs font-semibold flex items-center justify-center transition-all ${
                    i === currentPage
                      ? "text-white shadow-md"
                      : initials[i].trim()
                        ? "text-white/90"
                        : "text-white/60"
                  }`}
                  style={{
                    background:
                      i === currentPage
                        ? "rgba(255,255,255,0.3)"
                        : initials[i].trim()
                          ? "rgba(255,255,255,0.15)"
                          : "rgba(255,255,255,0.08)",
                    border:
                      initials[i].trim() && i !== currentPage
                        ? "1.5px solid rgba(255,255,255,0.4)"
                        : "1.5px solid transparent",
                  }}
                  data-testid={`button-page-${i + 1}`}
                >
                  {initials[i].trim() ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </button>
              ))}
            </div>
            <span className="text-xs text-white/60">
              Page {currentPage + 1} of {totalPages}
            </span>
          </div>

          <Card className="border-0 shadow-lg bg-white/95 backdrop-blur-md overflow-visible" data-testid="card-nda-content">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "#9CA3AF" }}>
                  Confidential
                </span>
                <span className="text-xs" style={{ color: "#6B7280" }}>
                  {ndaPages[currentPage].title}
                </span>
              </div>

              <div className="min-h-[340px]" data-testid={`nda-page-content-${currentPage + 1}`}>
                <NdaPageContent page={ndaPages[currentPage]} />
              </div>

              <div className="mt-6 pt-4 border-t flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium" style={{ color: "#374151" }}>
                    Initials for Page {currentPage + 1}:
                  </label>
                  <Input
                    value={initials[currentPage]}
                    onChange={(e) => updateInitials(currentPage, e.target.value.toUpperCase())}
                    placeholder="e.g. AB"
                    className="w-20 text-center uppercase font-semibold"
                    maxLength={4}
                    data-testid={`input-initials-page-${currentPage + 1}`}
                  />
                  {initials[currentPage].trim() && <Check className="w-4 h-4" style={{ color: "#10B981" }} />}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                    disabled={currentPage === 0}
                    data-testid="button-prev-page"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  {!isLastPage && (
                    <Button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={!canProceed}
                      style={{ background: canProceed ? "linear-gradient(135deg, #2e5cbf, #008ed3)" : undefined }}
                      className={canProceed ? "text-white" : ""}
                      data-testid="button-next-page"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {isLastPage && allInitialed && (
            <Card className="border-0 shadow-md bg-white/90 backdrop-blur-md overflow-visible mt-4" data-testid="card-signature">
              <CardContent className="p-6">
                <h3 className="text-sm font-bold mb-4" style={{ color: "#1a2332", fontFamily: '"AA Stetica Medium", sans-serif' }}>
                  Sign Agreement
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs mb-1" style={{ color: "#6B7280" }}>CareFlow Systems GmbH</p>
                    <p className="text-xs font-medium" style={{ color: "#374151" }}>
                      Place/Date: Hamburg, {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </p>
                    <p className="text-xs" style={{ color: "#374151" }}>Name: Dr. Oliver Bergmann</p>
                    <p className="text-xs" style={{ color: "#374151" }}>Title: CEO</p>
                    <div className="mt-2 pt-2 border-t">
                      <p className="text-xs italic" style={{ color: "#9CA3AF" }}>Signed digitally</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs mb-1" style={{ color: "#6B7280" }}>Contracting Partner</p>
                    <p className="text-xs font-medium" style={{ color: "#374151" }}>
                      Place/Date: {city || "__________"},{" "}
                      {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </p>
                    <p className="text-xs" style={{ color: "#374151" }}>
                      Name: {firstName} {lastName}
                    </p>
                    <p className="text-xs" style={{ color: "#374151" }}>Organization: {company}</p>
                    <div className="mt-2 space-y-1">
                      <label className="text-xs font-medium" style={{ color: "#374151" }}>
                        Type your full name as signature *
                      </label>
                      <Input
                        value={signatureText}
                        onChange={(e) => setSignatureText(e.target.value)}
                        placeholder="Your full name"
                        className="font-semibold"
                        style={{ fontStyle: "italic" }}
                        data-testid="input-signature"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2 mb-4">
                  <Checkbox
                    id="accept-nda"
                    checked={accepted}
                    onCheckedChange={(v) => setAccepted(!!v)}
                    data-testid="checkbox-accept-nda"
                  />
                  <label htmlFor="accept-nda" className="text-xs cursor-pointer leading-relaxed" style={{ color: "#374151" }}>
                    I have read and understood the Mutual Non-Disclosure Agreement between CareFlow Systems GmbH and myself / my organization. I agree to be bound by its terms and conditions.
                  </label>
                </div>

                <Button
                  onClick={handleSign}
                  disabled={!accepted || !signatureText.trim() || signMutation.isPending}
                  style={{
                    background:
                      accepted && signatureText.trim()
                        ? "linear-gradient(135deg, #2e5cbf, #008ed3)"
                        : undefined,
                  }}
                  className={accepted && signatureText.trim() ? "w-full text-white" : "w-full"}
                  data-testid="button-sign-nda"
                >
                  {signMutation.isPending ? "Signing..." : "Sign & Accept Agreement"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <footer className="relative z-20 text-center py-4">
        <p className="text-white/70 text-xs tracking-wide" data-testid="text-copyright">
          &copy;2026 CareFlow Systems GmbH &middot; V 2.0.0
        </p>
      </footer>
    </div>
  );
}
