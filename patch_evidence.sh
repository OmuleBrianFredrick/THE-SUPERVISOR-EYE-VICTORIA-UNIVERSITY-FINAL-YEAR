sed -i -e '/import React/c\
import React, { useState } from "react";' src/pages/EvidenceLibrary.tsx

sed -i -e '/import EvidenceGallery/c\
import EvidenceGallery from "../components/features/EvidenceGallery";\
import { useEvidenceQuery, useEvidenceAnalyticsQuery } from "../hooks/useQueries";' src/pages/EvidenceLibrary.tsx

