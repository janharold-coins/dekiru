// Figma get_design_context reference — Slide 26 (section divider L2, instance-only frame), node 511:29787. Verbatim; asset URLs expire ~7 days after 2026-10-06.
// Content is an instance "29" (511:29789) of the L2 section component (component node ids 405:131xx / 406:13205 / 408:13333).
// Local assets: imgBg -> /figma/shared/bg-dark.svg ; imgGroup54416 -> /figma/shared/logo-white-sm.svg
// imgLine2 -> /figma/s10/line-h.svg ; imgLine6 -> /figma/s10/line-h-mid.svg ; imgLine4 -> /figma/s10/line-v.svg (byte-identical to slide 10's)
// Figma style present: "bgslideblack"
const imgBg = "https://www.figma.com/api/mcp/asset/f5bd7c73-b85d-4804-af5d-23a8e4be8149.svg";
const imgGroup54416 = "https://www.figma.com/api/mcp/asset/5c470cb0-7a13-435c-bcb8-eaee684d1617.svg";
const imgLine2 = "https://www.figma.com/api/mcp/asset/d8474d3e-c525-4ee8-9f31-d0756a7677bf.svg";
const imgLine6 = "https://www.figma.com/api/mcp/asset/c612ddf5-0661-40e6-9d9e-d3ae70592239.svg";
const imgLine4 = "https://www.figma.com/api/mcp/asset/d785acd8-84dd-4231-bb39-3f531678d634.svg";

function Bg({ className }: { className?: string }) {
  return (
    <div className={className || "h-[1080px] relative w-[1920px]"} data-node-id="511:26153" data-name="BG">
      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgBg} />
    </div>
  );
}

export default function Component26() {
  return (
    <div className="relative size-full" data-node-id="511:29787" style={{ backgroundImage: "linear-gradient(144.83648150139365deg, rgb(23, 25, 29) 17.147%, rgb(20, 20, 20) 72.199%)" }} data-name="26">
      <Bg className="absolute h-[1080px] left-0 top-0 w-[1920px]" />
      <div className="absolute h-[1080px] left-0 overflow-clip top-0 w-[1920px]" data-node-id="511:29789" data-name="29">
        <div className="-translate-x-1/2 -translate-y-1/2 absolute h-[52.341px] left-[calc(50%-769.78px)] top-[calc(50%-388.83px)] w-[222.45px]" data-node-id="I511:29789;405:13177" data-name="Icon/Logo">
          <div className="absolute inset-[0_0.78%_0_0]" data-node-id="I511:29789;405:13177;738:2734">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup54416} />
          </div>
        </div>
        <p className="[word-break:break-word] absolute font-['TWK_Everett:Regular'] leading-[1.15] left-[71.5px] not-italic opacity-20 text-[60px] text-white top-[252.5px] tracking-[-1.8px] whitespace-nowrap" data-node-id="I511:29789;405:13178">
          02
        </p>
        <div className="absolute h-[33px] left-[79px] top-[938px] w-[426px]" data-node-id="I511:29789;405:13179" data-name="Strictly Private And Confidential">
          <p className="[word-break:break-word] absolute font-['Cns_Manrope:Regular'] inset-0 leading-[normal] not-italic text-[24px] text-white tracking-[2.4px] whitespace-nowrap" data-node-id="I511:29789;405:13179;394:11693">
            Strictly Private And Confidential
          </p>
        </div>
        <p className="[word-break:break-word] absolute font-['Cns_Manrope:Regular'] leading-[1.15] left-[159.5px] not-italic opacity-60 text-[60px] text-white top-[252.5px] tracking-[-1.8px] whitespace-nowrap" data-node-id="I511:29789;405:13180">
          Products and Pricing
        </p>
        <p className="[word-break:break-word] absolute font-['Cns_Manrope:SemiBold'] leading-[1.15] left-[150px] not-italic text-[120px] text-white top-[472px] tracking-[-3.6px] whitespace-nowrap" data-node-id="I511:29789;405:13181">
          Move / Cross-border
        </p>
        <div className="absolute h-0 left-0 top-[311px] w-[728px]" data-node-id="I511:29789;405:13182">
          <div className="absolute inset-[-0.5px_0_0_0]">
            <img alt="" className="block max-w-none size-full" src={imgLine2} />
          </div>
        </div>
        <div className="absolute h-0 left-0 top-[265.5px] w-[728px]" data-node-id="I511:29789;405:13183">
          <div className="absolute inset-[-0.5px_0_0_0]">
            <img alt="" className="block max-w-none size-full" src={imgLine2} />
          </div>
        </div>
        <div className="absolute h-0 left-0 top-[292px] w-[728px]" data-node-id="I511:29789;405:13184">
          <div className="absolute inset-[-0.5px_0_0_0]">
            <img alt="" className="block max-w-none size-full" src={imgLine6} />
          </div>
        </div>
        <div className="absolute flex h-[70px] items-center justify-center left-[159.5px] top-[252px] w-0" data-node-id="I511:29789;405:13185">
          <div className="-rotate-90 flex-none">
            <div className="h-0 relative w-[70px]">
              <div className="absolute inset-[-0.5px_0_0_0]">
                <img alt="" className="block max-w-none size-full" src={imgLine4} />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute flex h-[70px] items-center justify-center left-[728px] top-[252px] w-0" data-node-id="I511:29789;408:13333">
          <div className="-rotate-90 flex-none">
            <div className="h-0 relative w-[70px]">
              <div className="absolute inset-[-0.5px_0_0_0]">
                <img alt="" className="block max-w-none size-full" src={imgLine4} />
              </div>
            </div>
          </div>
        </div>
        <p className="[word-break:break-word] absolute font-['Cns_Manrope:Regular'] inset-[57.59%_19.48%_36.2%_7.81%] leading-[1.4] not-italic text-[48px] text-white tracking-[-0.72px] whitespace-nowrap" data-node-id="I511:29789;406:13205">
          Multi-currency wallets and corridor infrastructure.
        </p>
      </div>
    </div>
  );
}
