import PrimaryHeader from "../layout/PrimaryHeader";
import { buscadorNavLinks } from "../../data/buscadorData";

export default function ResultadosHeader() {
  return <PrimaryHeader links={buscadorNavLinks} />;
}
