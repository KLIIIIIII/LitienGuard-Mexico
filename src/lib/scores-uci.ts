export type SofaInput = {
  pao2Fio2: number;
  ventMecanica: boolean;
  plaquetasMil: number;
  bilirrubinaMg: number;
  map: number;
  dopaminaMcgKgMin: number;
  dobutaminaActiva: boolean;
  norepinefrinaMcgKgMin: number;
  adrenalinaMcgKgMin: number;
  glasgow: number;
  creatininaMg: number;
  gastoUrinarioMlDia: number;
};

export type SofaSubscores = {
  respiratorio: number;
  coagulacion: number;
  hepatico: number;
  cardiovascular: number;
  neurologico: number;
  renal: number;
  total: number;
};

export function calcularSofa(input: SofaInput): SofaSubscores {
  let respiratorio = 0;
  if (input.pao2Fio2 < 100 && input.ventMecanica) respiratorio = 4;
  else if (input.pao2Fio2 < 200 && input.ventMecanica) respiratorio = 3;
  else if (input.pao2Fio2 < 300) respiratorio = 2;
  else if (input.pao2Fio2 < 400) respiratorio = 1;

  let coagulacion = 0;
  if (input.plaquetasMil < 20) coagulacion = 4;
  else if (input.plaquetasMil < 50) coagulacion = 3;
  else if (input.plaquetasMil < 100) coagulacion = 2;
  else if (input.plaquetasMil < 150) coagulacion = 1;

  let hepatico = 0;
  if (input.bilirrubinaMg >= 12) hepatico = 4;
  else if (input.bilirrubinaMg >= 6) hepatico = 3;
  else if (input.bilirrubinaMg >= 2) hepatico = 2;
  else if (input.bilirrubinaMg >= 1.2) hepatico = 1;

  let cardiovascular = 0;
  if (input.dopaminaMcgKgMin > 15 || input.norepinefrinaMcgKgMin > 0.1 || input.adrenalinaMcgKgMin > 0.1) {
    cardiovascular = 4;
  } else if (input.dopaminaMcgKgMin > 5 || input.norepinefrinaMcgKgMin > 0 || input.adrenalinaMcgKgMin > 0) {
    cardiovascular = 3;
  } else if (input.dopaminaMcgKgMin > 0 && input.dopaminaMcgKgMin <= 5) {
    cardiovascular = 2;
  } else if (input.dobutaminaActiva) {
    cardiovascular = 2;
  } else if (input.map < 70) {
    cardiovascular = 1;
  }

  let neurologico = 0;
  if (input.glasgow < 6) neurologico = 4;
  else if (input.glasgow < 10) neurologico = 3;
  else if (input.glasgow < 13) neurologico = 2;
  else if (input.glasgow < 15) neurologico = 1;

  let renal = 0;
  if (input.creatininaMg >= 5 || (input.gastoUrinarioMlDia > 0 && input.gastoUrinarioMlDia < 200)) {
    renal = 4;
  } else if (input.creatininaMg >= 3.5 || (input.gastoUrinarioMlDia > 0 && input.gastoUrinarioMlDia < 500)) {
    renal = 3;
  } else if (input.creatininaMg >= 2) {
    renal = 2;
  } else if (input.creatininaMg >= 1.2) {
    renal = 1;
  }

  const total =
    respiratorio + coagulacion + hepatico + cardiovascular + neurologico + renal;
  return {
    respiratorio,
    coagulacion,
    hepatico,
    cardiovascular,
    neurologico,
    renal,
    total,
  };
}

export function interpretarSofa(total: number): {
  riesgo: "bajo" | "moderado" | "alto" | "critico";
  mortalidad: string;
  mensaje: string;
} {
  if (total <= 6) {
    return {
      riesgo: "bajo",
      mortalidad: "< 10%",
      mensaje: "Disfunción orgánica leve.",
    };
  }
  if (total <= 9) {
    return {
      riesgo: "moderado",
      mortalidad: "15-20%",
      mensaje: "Disfunción orgánica moderada — monitoreo estrecho.",
    };
  }
  if (total <= 12) {
    return {
      riesgo: "alto",
      mortalidad: "40-50%",
      mensaje: "Disfunción multiorgánica — soporte intensivo.",
    };
  }
  return {
    riesgo: "critico",
    mortalidad: "> 80%",
    mensaje: "Falla multiorgánica grave — pronóstico reservado.",
  };
}
