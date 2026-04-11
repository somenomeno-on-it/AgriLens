/**
 * Static Bangladesh region data for admin district/upazila pickers.
 * Values are lowercase for API consistency; labels are title-cased in UI.
 */
export const BD_REGIONS = [
  {
    district: "dhaka",
    label: "Dhaka",
    upazilas: [
      { value: "dhamrai", label: "Dhamrai" },
      { value: "savar", label: "Savar" },
      { value: "keraniganj", label: "Keraniganj" },
      { value: "nawabganj", label: "Nawabganj" },
      { value: "dohar", label: "Dohar" },
    ],
  },
  {
    district: "gazipur",
    label: "Gazipur",
    upazilas: [
      { value: "gazipur sadar", label: "Gazipur Sadar" },
      { value: "kapasia", label: "Kapasia" },
      { value: "kaliganj", label: "Kaliganj" },
      { value: "sreepur", label: "Sreepur" },
    ],
  },
  {
    district: "narayanganj",
    label: "Narayanganj",
    upazilas: [
      { value: "narayanganj sadar", label: "Narayanganj Sadar" },
      { value: "bandar", label: "Bandar" },
      { value: "sonargaon", label: "Sonargaon" },
      { value: "araihazar", label: "Araihazar" },
    ],
  },
  {
    district: "chattogram",
    label: "Chattogram",
    upazilas: [
      { value: "chattogram sadar", label: "Chattogram Sadar" },
      { value: "hathazari", label: "Hathazari" },
      { value: "sitakunda", label: "Sitakunda" },
      { value: "patiya", label: "Patiya" },
    ],
  },
  {
    district: "sylhet",
    label: "Sylhet",
    upazilas: [
      { value: "sylhet sadar", label: "Sylhet Sadar" },
      { value: "beanibazar", label: "Beanibazar" },
      { value: "golapganj", label: "Golapganj" },
      { value: "zakiganj", label: "Zakiganj" },
    ],
  },
  {
    district: "rajshahi",
    label: "Rajshahi",
    upazilas: [
      { value: "rajshahi sadar", label: "Rajshahi Sadar" },
      { value: "paba", label: "Paba" },
      { value: "bagha", label: "Bagha" },
      { value: "tanore", label: "Tanore" },
    ],
  },
  {
    district: "khulna",
    label: "Khulna",
    upazilas: [
      { value: "khulna sadar", label: "Khulna Sadar" },
      { value: "dumuria", label: "Dumuria" },
      { value: "rupsha", label: "Rupsha" },
      { value: "paikgacha", label: "Paikgacha" },
    ],
  },
  {
    district: "barishal",
    label: "Barishal",
    upazilas: [
      { value: "barishal sadar", label: "Barishal Sadar" },
      { value: "babuganj", label: "Babuganj" },
      { value: "muladi", label: "Muladi" },
      { value: "mehendiganj", label: "Mehendiganj" },
    ],
  },
];

export function getDistrictOptions() {
  return BD_REGIONS.map((r) => ({ value: r.district, label: r.label }));
}

export function getUpazilaOptionsForDistrict(districtValue) {
  const d = String(districtValue || "").toLowerCase().trim();
  const row = BD_REGIONS.find((r) => r.district === d);
  return row ? row.upazilas : [];
}
