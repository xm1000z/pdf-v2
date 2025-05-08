"use client";

import { SparklesIcon } from "lucide-react";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import Dropzone from "react-dropzone";
import HomepageImage1 from "./images/homepage-image-1";
import HomepageImage2 from "./images/homepage-image-2";
import { StatusApp } from "@/app/page";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "./ui/slider";
import { useState } from "react";

export const HomeLandingDrop = ({
  status,
  file,
  setFile,
  handleSubmit,
}: {
  status: StatusApp;
  file?: File | null;
  setFile: (file: File | null) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) => {
  const { toast } = useToast();
  const [summaryLength, setSummaryLength] = useState<number[]>([3]);

  // Función para convertir el valor del slider a texto descriptivo
  const getLengthDescription = (value: number) => {
    switch (value) {
      case 1:
        return "Muy breve";
      case 2:
        return "Breve";
      case 3:
        return "Normal";
      case 4:
        return "Detallado";
      case 5:
        return "Muy detallado";
      default:
        return "Normal";
    }
  };

  return (
    <div className="mx-auto mt-6 max-w-lg md:mt-10">
      <h1 className="text-center text-5xl font-bold md:text-5xl font-[InstrumentSerif]">
        Resume tus PDFs
        <br /> <span className="italic" >en segundos</span>
      </h1>
      <p className="mx-auto mt-6 max-w-md text-balance text-center leading-snug md:text-lg md:leading-snug">
        Sube un <strong>PDF</strong> para obtener un resumen rápido, claro y
        compartible.
      </p>

      <form
        onSubmit={handleSubmit}
        className="relative mx-auto mt-20 max-w-md px-4 md:mt-16"
      >
        <div className="pointer-events-none absolute left-[-40px] top-[-185px] flex w-[200px] items-center md:-left-[calc(min(30vw,350px))] md:-top-20 md:w-[390px]">
          <HomepageImage1 />
        </div>
        <div className="pointer-events-none absolute right-[20px] top-[-110px] flex w-[70px] justify-center md:-right-[calc(min(30vw,350px))] md:-top-5 md:w-[390px]">
          <HomepageImage2 />
        </div>

        <div className="relative">
          <div className="flex flex-col rounded-xl bg-white px-6 py-6 shadow md:px-12 md:py-8">
            <label className="text-gray-500" htmlFor="file">
              Subir PDF
            </label>
            <Dropzone
              multiple={false}
              accept={{
                "application/pdf": [".pdf"],
              }}
              onDrop={(acceptedFiles) => {
                const file = acceptedFiles[0];
                if (file.size > 15 * 1024 * 1024) {
                  // 10MB in bytes
                  toast({
                    title: "📁 Archivo demasiado grande",
                    description: "⚠️ El tamaño del archivo debe ser menor a 15MB",
                  });
                  return;
                }
                setFile(file);
              }}
            >
              {({ getRootProps, getInputProps, isDragAccept }) => (
                <div
                  className={`mt-2 flex aspect-video cursor-pointer items-center justify-center rounded-lg border border-dashed bg-gray-100 ${isDragAccept ? "border-blue-500" : "border-gray-250"}`}
                  {...getRootProps()}
                >
                  <input required={!file} {...getInputProps()} />
                  <div className="text-center">
                    {file ? (
                      <p>{file.name}</p>
                    ) : (
                      <Button type="button" className="md:text-base">
                        Selecccionar PDF
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </Dropzone>
            <label className="mt-8 text-gray-500" htmlFor="language">
              Idioma
            </label>
            <Select defaultValue="spanish" name="language">
              <SelectTrigger className="mt-2 bg-gray-100" id="language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[
                  { label: "Español", value: "spanish" },
                  { label: "Inglés", value: "english" },
                  { label: "Catalán", value: "catalan" },
                  { label: "Vasco", value: "basque" },
                  { label: "Gallego", value: "galician" },
                ].map((language) => (
                  <SelectItem key={language.value} value={language.value}>
                    {language.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="mt-8">
              <div className="flex justify-between">
                <label className="text-gray-500" htmlFor="length">
                  Longitud del resumen
                </label>
                <span className="text-sm text-gray-500">
                  {getLengthDescription(summaryLength[0])}
                </span>
              </div>
              <input type="hidden" name="summary_length" value={summaryLength[0]} />
              <Slider
                className="mt-2"
                id="length"
                min={1}
                max={5}
                step={1}
                value={summaryLength}
                onValueChange={setSummaryLength}
              />
              <div className="mt-1 flex justify-between text-xs text-gray-400">
                <span>Corto</span>
                <span>Largo</span>
              </div>
            </div>
          </div>
          <div className="mt-8 text-center">
            <Button
              type="submit"
              variant="secondary"
              className="w-60 border bg-white/80 text-base font-semibold hover:bg-white md:w-auto"
              disabled={status === "parsing"}
            >
              <SparklesIcon />
              Generar
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
